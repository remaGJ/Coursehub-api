import {
    IsIn,
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class UpdateCourseDto {
  @IsString() // 3
  @IsNotEmpty() // 4
  title: string;

  @IsIn(['beginner', 'intermediate', 'advanced']) // 5
  level: string;
}