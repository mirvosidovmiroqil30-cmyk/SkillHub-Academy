import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TelegramService } from './telegram.service';
import { User } from '../users/models/user.model';
import { Enrollment } from '../enrollments/models/enrollment.model';
import { Assignment } from '../assignments/models/assignment.model';
import { Course } from '../courses/models/course.model';

@Module({
  imports: [SequelizeModule.forFeature([User, Enrollment, Assignment, Course])],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
