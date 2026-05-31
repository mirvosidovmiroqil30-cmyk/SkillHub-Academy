import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../users/models/user.model';

@Controller('api/assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: User) {
    return this.assignmentsService.create(dto, user.id);
  }

  @Get('course/:courseId')
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  findByCourse(@Param('courseId', ParseIdPipe) courseId: number) {
    return this.assignmentsService.findByCourse(courseId);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER)
  update(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateAssignmentDto,
    @CurrentUser() user: User,
  ) {
    return this.assignmentsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: User) {
    return this.assignmentsService.remove(id, user.id);
  }
}
