import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Query,
  } from '@nestjs/common';
  import { EnrollmentsService } from './enrollments.service.js';
  import { CreateEnrollmentDto } from './dto/create-enrollments.dto.js';
  import { EnrollmentsQueryDto } from './dto/enrollments-query.dto.js';
  import { ParseStudentIdPipe } from '../students/pipes/parse-student-id.pipe.js';
  
  @Controller()
  export class EnrollmentsController {
    constructor(private readonly enrollmentsService: EnrollmentsService) {}
  
    @Post('enrollments')
    create(@Body() dto: CreateEnrollmentDto) {
      return this.enrollmentsService.create(dto);
    }
  
    @Get('enrollments')
    findAll(@Query() query: EnrollmentsQueryDto) {
      return this.enrollmentsService.findAll(query);
    }
  
    @Get('students/:studentId/enrollments')
    findByStudent(@Param('studentId', ParseStudentIdPipe) studentId: number) {
      return this.enrollmentsService.findByStudent(studentId);
    }
  
    @Get('courses/:courseId/enrollments')
    findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
      return this.enrollmentsService.findByCourse(courseId);
    }
  
    @Delete('enrollments/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.enrollmentsService.remove(id);
    }
  }