import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ rows: User[]; count: number }> {
    const offset = (page - 1) * limit;
    return this.userModel.findAndCountAll({
      attributes: [
        'id',
        'full_name',
        'email',
        'role',
        'is_active',
        'created_at',
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      attributes: [
        'id',
        'full_name',
        'email',
        'role',
        'is_active',
        'telegram_id',
        'created_at',
      ],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    await user.update(dto);
    return user;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
