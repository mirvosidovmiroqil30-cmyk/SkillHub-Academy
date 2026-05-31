import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { courseImageStorage } from './multer.config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { CourseImageValidationPipe } from '../../common/pipes/file-validation.pipe';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/models/user.model';

@Controller('api/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findAll() {
    return this.coursesService.findAll();
  }

  @Post()
  @Roles(UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('image', { storage: courseImageStorage }))
  create(
    @Body() dto: CreateCourseDto,
    @CurrentUser() user: User,
    @UploadedFile(CourseImageValidationPipe) file?: Express.Multer.File,
  ) {
    return this.coursesService.create(dto, user.id, file);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('image', { storage: courseImageStorage }))
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: User,
    @UploadedFile(CourseImageValidationPipe) file?: Express.Multer.File,
  ) {
    return this.coursesService.update(id, dto, user.id, file);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.coursesService.remove(id);
  }

  @Post(':id/enroll')
  @Roles(UserRole.STUDENT)
  enroll(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: User) {
    return this.coursesService.enroll(id, user.id);
  }

  @Get('my-enrollments')
  @Roles(UserRole.STUDENT)
  getMyEnrollments(@CurrentUser() user: User) {
    return this.coursesService.getMyEnrollments(user.id);
  }

  @Get(':id/students')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  getStudents(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: User) {
    return this.coursesService.getStudents(id, user);
  }
}
