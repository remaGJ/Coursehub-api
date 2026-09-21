import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';

import { StudentsService } from './students.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { ParseStudentIdPipe } from './pipes/parse-student-id.pipe.js';

@Controller('students')
export class StudentsController {
    constructor(
        private readonly studentsService: StudentsService,
    ) {}

    @Get()
    findAll(
        @Query('career') career?: string,
        @Query('semester') semester?: string,
        @Query('isActive') isActive?: string,
    ) {
        return this.studentsService.findAll(
            career,
            semester,
            isActive,
        );
    }

    @Get(':id')
    findOne(
        @Param('id', ParseStudentIdPipe) id: number,
    ) {
        return this.studentsService.findOne(id);
    }

    @Post()
    create(@Body() input: CreateStudentDto) {
        return this.studentsService.create(input);
    }

    @Patch(':id')
    update(
        @Param('id', ParseStudentIdPipe) id: number,
        @Body() input: UpdateStudentDto,
    ) {
        return this.studentsService.update(id, input);
    }

    @Delete(':id')
    remove(
        @Param('id', ParseStudentIdPipe) id: number,
    ) {
        return this.studentsService.remove(id);
    }

    @Patch(':id/status')
    toggleStatus(
        @Param('id', ParseStudentIdPipe) id: number,
    ) {
        return this.studentsService.toggleStatus(id);
    }
}