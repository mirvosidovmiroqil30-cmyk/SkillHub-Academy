import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Assignment } from './models/assignment.model';
import { Course } from '../courses/models/course.model';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment)
    private readonly assignmentModel: typeof Assignment,
    @InjectModel(Course) private readonly courseModel: typeof Course,
  ) {}

  async create(
    dto: CreateAssignmentDto,
    teacherId: number,
  ): Promise<Assignment> {
    const course = await this.courseModel.findByPk(dto.course_id);
    if (!course) {
      throw new NotFoundException(`Course with ID ${dto.course_id} not found`);
    }
    if (course.teacher_id !== teacherId) {
      throw new ForbiddenException(
        'You can only create assignments for your own courses',
      );
    }

    return this.assignmentModel.create({
      title: dto.title,
      description: dto.description,
      deadline: new Date(dto.deadline),
      course_id: dto.course_id,
    });
  }

  async findByCourse(courseId: number): Promise<Assignment[]> {
    return this.assignmentModel.findAll({
      where: { course_id: courseId },
      order: [['deadline', 'ASC']],
    });
  }

  async findOne(id: number): Promise<Assignment> {
    const assignment = await this.assignmentModel.findByPk(id);
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async update(
    id: number,
    dto: UpdateAssignmentDto,
    teacherId: number,
  ): Promise<Assignment> {
    const assignment = await this.findOne(id);
    const course = await this.courseModel.findByPk(assignment.course_id);

    if (!course || course.teacher_id !== teacherId) {
      throw new ForbiddenException(
        'You can only update assignments for your own courses',
      );
    }

    const { deadline, ...restDto } = dto;
    const updateData: Record<string, unknown> = { ...restDto };
    if (deadline) {
      updateData.deadline = new Date(deadline);
    }

    await assignment.update(updateData);
    return assignment;
  }

  async remove(id: number, teacherId: number): Promise<void> {
    const assignment = await this.findOne(id);
    const course = await this.courseModel.findByPk(assignment.course_id);

    if (!course || course.teacher_id !== teacherId) {
      throw new ForbiddenException(
        'You can only delete assignments for your own courses',
      );
    }

    await assignment.destroy();
  }
}
