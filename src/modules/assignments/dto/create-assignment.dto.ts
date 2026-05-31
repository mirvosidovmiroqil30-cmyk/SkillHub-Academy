import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
} from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  deadline: string;

  @IsInt()
  course_id: number;
}
