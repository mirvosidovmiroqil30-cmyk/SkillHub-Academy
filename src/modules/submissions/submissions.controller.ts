import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionsService } from './submissions.service';
import { ScoreSubmissionDto } from './dto/score-submission.dto';
import { submissionFileStorage } from './multer.config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { SubmissionFileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/models/user.model';

@Controller('api/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file', { storage: submissionFileStorage }))
  create(
    @Body('assignment_id', ParseIdPipe) assignmentId: number,
    @CurrentUser() user: User,
    @UploadedFile(SubmissionFileValidationPipe) file: Express.Multer.File,
  ) {
    return this.submissionsService.create(assignmentId, user.id, file);
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  findMySubmissions(@CurrentUser() user: User) {
    return this.submissionsService.findMySubmissions(user.id);
  }

  @Get('assignment/:id')
  @Roles(UserRole.TEACHER)
  findByAssignment(@Param('id', ParseIdPipe) id: number) {
    return this.submissionsService.findByAssignment(id);
  }

  @Patch(':id/score')
  @Roles(UserRole.TEACHER)
  score(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: ScoreSubmissionDto,
    @CurrentUser() user: User,
  ) {
    return this.submissionsService.score(id, dto, user.id);
  }

  @Get(':id')
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  findOne(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: User) {
    if (user.role === UserRole.TEACHER) {
      return this.submissionsService.findOneAsTeacher(id);
    }
    return this.submissionsService.findOne(id, user.id);
  }
}
