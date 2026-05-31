import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './models/course.model';
import { Enrollment } from '../enrollments/models/enrollment.model';
import { Category } from '../categories/models/category.model';

@Module({
  imports: [SequelizeModule.forFeature([Course, Enrollment, Category])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
