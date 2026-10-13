import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateEnrollmentDto } from './dto/create-enrollments.dto.js';
import { Enrollment } from './entities/enrollment.entity.js';
import { Student } from '../students/entities/student.entity.js';
import { Course } from '../courses/entities/course.entity.js';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) { }

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    const student = await this.ensureStudentExists(dto.studentId);
    const course = await this.ensureCourseExists(dto.courseId);

    if (!student.isActive) {
      throw new UnprocessableEntityException(
        `El estudiante ${dto.studentId} está inactivo`,
      );
    }

    const duplicated = await this.enrollmentsRepository.findOne({
      where: { student: { id: student.id }, course: { id: course.id } },
    });
    if (duplicated) {
      throw new ConflictException(
        'El estudiante ya está matriculado en este curso',
      );
    }

    return this.enrollmentsRepository.save(
      this.enrollmentsRepository.create({ student, course }),
    );
  }

  findAll(studentId?: number, courseId?: number) {
    return this.enrollmentsRepository.find({
      where: {
        ...(studentId ? { student: { id: studentId } } : {}),
        ...(courseId ? { course: { id: courseId } } : {}),
      },
      relations: { student: true, course: true },
      order: { id: 'ASC' },
    });
  }

  async findByStudent(studentId: number) {
    await this.ensureStudentExists(studentId); // 404 si no existe
    return this.findAll(studentId);
  }

  async findByCourse(courseId: number) {
    await this.ensureCourseExists(courseId); // 404 si no existe
    return this.findAll(undefined, courseId);
  }

  async remove(id: number): Promise<void> {
    const enrollment = await this.enrollmentsRepository.findOneBy({ id });
    if (!enrollment) {
      throw new NotFoundException(`Matrícula ${id} no encontrada`);
    }
    await this.enrollmentsRepository.remove(enrollment);
  }

  private async ensureStudentExists(id: number): Promise<Student> {
    const student = await this.studentsRepository.findOneBy({ id });
    if (!student) {
      throw new NotFoundException(`Estudiante ${id} no encontrado`);
    }
    return student;
  }

  private async ensureCourseExists(id: number): Promise<Course> {
    const course = await this.coursesRepository.findOneBy({ id });
    if (!course) {
      throw new NotFoundException(`Curso ${id} no encontrado`);
    }
    return course;
  }
}