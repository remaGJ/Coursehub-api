import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { UpdateCourseUseCase } from './use-cases/update-course.use-case.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/user-role.enum.js';
import type { RequestWithUser } from '../auth/types/jwt-payload.type.js';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly updateCourseUseCase: UpdateCourseUseCase,
  ) {}

  @Get()
  findAll(@Query() query: CoursesQueryDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(
    @Body() createCourseDto: CreateCourseDto,
    @Req() request: RequestWithUser,
  ) {
    return this.coursesService.create(createCourseDto, request?.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCourseDto,
    @Req() request: RequestWithUser,
  ) {
    return this.updateCourseUseCase.execute(id, body, request?.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(id);
  }
}
