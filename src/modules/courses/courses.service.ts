import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Course } from './models/course.model';
import { Enrollment } from '../enrollments/models/enrollment.model';
import { Category } from '../categories/models/category.model';
import { User } from '../users/models/user.model';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course) private readonly courseModel: typeof Course,
    @InjectModel(Enrollment)
    private readonly enrollmentModel: typeof Enrollment,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
  ) {}

  async create(
    dto: CreateCourseDto,
    teacherId: number,
    file?: Express.Multer.File,
  ): Promise<Course> {
    if (dto.category_id) {
      const category = await this.categoryModel.findByPk(dto.category_id);
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${dto.category_id} not found`,
        );
      }
    }

    const image = file ? `/public/uploads/courses/${file.filename}` : null;
    return this.courseModel.create({
      ...dto,
      teacher_id: teacherId,
      image,
    });
  }

  async findAll(): Promise<Course[]> {
    return this.courseModel.findAll({
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'full_name', 'email'],
        },
        {
          model: Category,
          attributes: ['id', 'name'],
        },
      ],
    });
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.courseModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'full_name', 'email'],
        },
        {
          model: Category,
          attributes: ['id', 'name'],
        },
      ],
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async update(
    id: number,
    dto: UpdateCourseDto,
    teacherId: number,
    file?: Express.Multer.File,
  ): Promise<Course> {
    const course = await this.findOne(id);

    if (course.teacher_id !== teacherId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    if (dto.category_id) {
      const category = await this.categoryModel.findByPk(dto.category_id);
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${dto.category_id} not found`,
        );
      }
    }

    const updateData: Partial<Course> = { ...dto };
    if (file) {
      updateData.image = `/public/uploads/courses/${file.filename}`;
    }

    await course.update(updateData);
    return course;
  }

  async remove(id: number): Promise<void> {
    const course = await this.findOne(id);
    await course.destroy();
  }

  async enroll(courseId: number, studentId: number): Promise<Enrollment> {
    await this.findOne(courseId);

    const existing = await this.enrollmentModel.findOne({
      where: { course_id: courseId, student_id: studentId },
    });
    if (existing) {
      throw new ConflictException('Already enrolled in this course');
    }

    return this.enrollmentModel.create({
      course_id: courseId,
      student_id: studentId,
    });
  }

  async getMyEnrollments(studentId: number): Promise<Course[]> {
    const enrollments = await this.enrollmentModel.findAll({
      where: { student_id: studentId },
      include: [
        {
          model: Course,
          include: [{ model: Category, attributes: ['id', 'name'] }],
        },
      ],
    });
    // Filter out enrollments where the course may have been deleted
    return enrollments.map((e) => e.course).filter(Boolean) as Course[];
  }

  async getStudents(courseId: number, requestingUser: User): Promise<User[]> {
    const course = await this.findOne(courseId);

    if (requestingUser.role === UserRole.STUDENT) {
      throw new ForbiddenException(
        'Only teachers and admins can view enrolled students',
      );
    }

    if (
      requestingUser.role === UserRole.TEACHER &&
      course.teacher_id !== requestingUser.id
    ) {
      throw new ForbiddenException(
        'You can only view students of your own courses',
      );
    }

    const enrollments = await this.enrollmentModel.findAll({
      where: { course_id: courseId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
    });

    // Filter out enrollments where the student may have been deleted
    return enrollments.map((e) => e.student).filter(Boolean) as User[];
  }
}
