import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { Course_ } from './entities/course.entity.js';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course_)
    private readonly coursesRepository: Repository<Course_>,
  ) {} // 1

  async findAll(query: CoursesQueryDto) {
    const { level, page, limit, sortBy, order } = query;
    const [items, total] = await this.coursesRepository.findAndCount({
      where: level ? { level } : {},
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Course_> {
    const course = await this.coursesRepository.findOneBy({ id: Number(id) }); // 4
    if (!course) throw new NotFoundException(`Course ${id} not found`); // 5
    return course;
  }

  create(dto: CreateCourseDto) { // 6
    const course = this.coursesRepository.create(dto);
    return this.coursesRepository.save(course);
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.findOne(id); // 7
    Object.assign(course, dto);
    return this.coursesRepository.save(course); // 8
  }

  async remove(id: string) {
    const course = await this.findOne(id); // 9
    await this.coursesRepository.remove(course); // 10
    return course;
  }
}