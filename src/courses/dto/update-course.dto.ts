import {
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: string;
}
