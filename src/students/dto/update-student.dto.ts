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

export class UpdateStudentDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    Name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsInt()
    age?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    career?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    semester?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}