import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/models/user.model';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const isDevMode = process.env.NODE_ENV !== 'production';

    const user = await this.userModel.create({
      full_name: dto.full_name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      is_active: isDevMode,
      telegram_id: null,
    });

    if (!isDevMode) {
      const activationToken = crypto.randomBytes(32).toString('hex');
      AuthService.activationTokens.set(activationToken, {
        userId: user.id,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 soat
      });
      await this.mailService.sendActivationEmail(dto.email, activationToken);
    } else {
      this.logger.log(`DEV MODE: account auto-activated for ${dto.email}`);
    }

    return user;
  }

  private static activationTokens = new Map<
    string,
    { userId: number; expiresAt: number }
  >();

  async activateAccount(token: string): Promise<void> {
    const entry = AuthService.activationTokens.get(token);

    if (!entry) {
      throw new UnauthorizedException('Invalid or expired activation token');
    }

    if (Date.now() > entry.expiresAt) {
      AuthService.activationTokens.delete(token);
      throw new UnauthorizedException('Activation token has expired');
    }

    const user = await this.userModel.findByPk(entry.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.is_active) {
      throw new BadRequestException('Account is already activated');
    }

    await user.update({ is_active: true });
    AuthService.activationTokens.delete(token);
  }

  async login(
    dto: LoginDto,
  ): Promise<{ access_token: string; role: string; full_name: string }> {
    if (!dto.password) {
      throw new BadRequestException('Password is required');
    }

    const user = await this.userModel.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.is_active) {
      if (user && !user.is_active) {
        throw new ForbiddenException(
          'Account is not activated. Please check your email.',
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    if (user.role === UserRole.STUDENT) {
      void this.mailService.sendLoginNotification(user.email, user.full_name);
    }

    return { access_token, role: user.role, full_name: user.full_name };
  }

  logout(): { message: string } {
    return { message: 'Logged out successfully. Please discard your token.' };
  }
}
