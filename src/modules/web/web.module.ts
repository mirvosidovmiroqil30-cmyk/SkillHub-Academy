import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { CategoriesModule } from '../categories/categories.module';
import { CoursesModule } from '../courses/courses.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { UsersModule } from '../users/users.module';
import { TelegramModule } from '../telegram/telegram.module';
import { WebController } from './web.controller';

@Module({
  imports: [
    AuthModule,
    CoursesModule,
    CategoriesModule,
    AssignmentsModule,
    SubmissionsModule,
    UsersModule,
    TelegramModule,
  ],
  controllers: [WebController],
})
export class WebModule {}