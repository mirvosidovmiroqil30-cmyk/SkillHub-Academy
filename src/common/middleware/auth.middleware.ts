import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../modules/users/models/user.model';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async use(
    req: Request & { user?: User },
    _res: Response,
    next: NextFunction,
  ) {
    try {
      const cookieToken = (req.cookies as Record<string, string> | undefined)
        ?.access_token;
      const authHeader = req.headers.authorization;
      const bearerToken =
        authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

      const token = cookieToken ?? bearerToken;

      if (token) {
        const secret = this.configService.get<string>('jwt.secret');
        const payload = this.jwtService.verify<{ sub: number }>(token, {
          secret,
        });

        const user = await this.userModel.findByPk(payload.sub);
        if (user) {
          req.user = user;
        }
      }
    } catch {

    }

    next();
  }
}
