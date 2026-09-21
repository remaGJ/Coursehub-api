import {
    IsBoolean,
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class CreateStudentDto {
    @IsString()
    @IsNotEmpty()
    Name: string;

    @IsEmail()
    email: string;

    @IsInt()
    age: number;

    @IsString()
    @IsNotEmpty()
    career: string;

    @IsInt()
    @Min(1)
    @Max(10)
    semester: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}