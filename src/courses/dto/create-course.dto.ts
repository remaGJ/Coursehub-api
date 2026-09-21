import { IsIn, IsNotEmpty, IsString } from 'class-validator'; // 1

export class CreateCourseDto { // 2
  @IsString() // 3
  @IsNotEmpty() // 4
  title: string;

  @IsIn(['beginner', 'intermediate', 'advanced']) // 5
  level: string;
}