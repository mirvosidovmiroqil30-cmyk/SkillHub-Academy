import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Submission } from './models/submission.model';
import { Assignment } from '../assignments/models/assignment.model';
import { Course } from '../courses/models/course.model';
import { User } from '../users/models/user.model';
import { MailService } from '../mail/mail.service';
import { ScoreSubmissionDto } from './dto/score-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission)
    private readonly submissionModel: typeof Submission,
    @InjectModel(Assignment)
    private readonly assignmentModel: typeof Assignment,
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly mailService: MailService,
  ) {}

  async create(
    assignmentId: number,
    studentId: number,
    file: Express.Multer.File,
  ): Promise<Submission> {
    const assignment = await this.assignmentModel.findByPk(assignmentId);
    if (!assignment) {
      throw new NotFoundException(
        `Assignment with ID ${assignmentId} not found`,
      );
    }

    if (new Date() > new Date(assignment.deadline)) {
      throw new UnprocessableEntityException('Submission deadline has passed');
    }

    const existing = await this.submissionModel.findOne({
      where: { assignment_id: assignmentId, student_id: studentId },
    });
    if (existing) {
      throw new ConflictException('You have already submitted this assignment');
    }

    return this.submissionModel.create({
      assignment_id: assignmentId,
      student_id: studentId,
      file: `/public/uploads/submissions/${file.filename}`,
      score: null,
    });
  }

  async findMySubmissions(studentId: number): Promise<Submission[]> {
    return this.submissionModel.findAll({
      where: { student_id: studentId },
      include: [{ model: Assignment, as: 'assignment' }],
      order: [['created_at', 'DESC']],
    });
  }

  async findByAssignment(assignmentId: number): Promise<Submission[]> {
    return this.submissionModel.findAll({
      where: { assignment_id: assignmentId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
    });
  }

  async score(
    id: number,
    dto: ScoreSubmissionDto,
    teacherId: number,
  ): Promise<Submission> {
    const submission = await this.submissionModel.findByPk(id, {
      include: [
        {
          model: Assignment,
          as: 'assignment',
          include: [{ model: Course, as: 'course' }],
        },
        { model: User, as: 'student' },
      ],
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    if (!submission.assignment) {
      throw new NotFoundException(`Assignment not found for submission ${id}`);
    }

    if (!submission.assignment.course) {
      throw new NotFoundException(`Course not found for assignment`);
    }

    if (submission.assignment.course.teacher_id !== teacherId) {
      throw new ForbiddenException(
        'You can only score submissions from your own courses',
      );
    }

    await submission.update({ score: dto.score });

    try {
      if (submission.student?.email) {
        await this.mailService.sendScoreNotification(
          submission.student.email,
          submission.assignment.title,
          dto.score,
        );
      }
    } catch {
      
    }

    return submission;
  }

  async findOne(id: number, studentId: number): Promise<Submission> {
    const submission = await this.submissionModel.findByPk(id, {
      include: [{ model: Assignment, as: 'assignment' }],
    });
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    if (submission.student_id !== studentId) {
      throw new ForbiddenException('You can only view your own submissions');
    }
    return submission;
  }

  async findOneAsTeacher(id: number): Promise<Submission> {
    const submission = await this.submissionModel.findByPk(id, {
      include: [
        { model: Assignment, as: 'assignment' },
        { model: User, as: 'student', attributes: ['id', 'full_name', 'email'] },
      ],
    });
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return submission;
  }
}
