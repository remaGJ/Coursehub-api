import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { StudentsService } from '../students/students.service.js';
import { CoursesService } from '../courses/courses.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollments.dto.js';

type Enrollment = {
  id: number;
  studentId: number;
  courseId: number;
};

@Injectable()
export class EnrollmentsService {
  private readonly enrollments: Enrollment[] = [];
  private nextId = 1;

  constructor(
    private readonly studentsService: StudentsService,
    private readonly coursesService: CoursesService,
  ) {}

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> { // CAMBIO: async
    const student = this.studentsService.findOne(dto.studentId); // 404 si no existe
    await this.coursesService.findOne(String(dto.courseId)); // CAMBIO: await + String()

    if (!student.isActive) {
      throw new UnprocessableEntityException(
        `El estudiante ${dto.studentId} está inactivo`,
      );
    }

    const duplicated = this.enrollments.some(
      (m) => m.studentId === dto.studentId && m.courseId === dto.courseId,
    );
    if (duplicated) {
      throw new ConflictException(
        'El estudiante ya está matriculado en este curso',
      );
    }

    const enrollment: Enrollment = {
      id: this.nextId++,
      studentId: dto.studentId,
      courseId: dto.courseId,
    };
    this.enrollments.push(enrollment);
    return enrollment;
  }

  findAll(filters: { studentId?: number; courseId?: number } = {}): Enrollment[] {
    return this.enrollments.filter(
      (e) =>
        (filters.studentId === undefined || e.studentId === filters.studentId) &&
        (filters.courseId === undefined || e.courseId === filters.courseId),
    );
  }

  findByStudent(studentId: number): Enrollment[] {
    this.studentsService.findOne(studentId); // 404 si no existe
    return this.findAll({ studentId });
  }

  async findByCourse(courseId: number): Promise<Enrollment[]> { // CAMBIO: async
    await this.ensureCourseExists(courseId); // CAMBIO: await
    return this.findAll({ courseId });
  }

  remove(id: number): void {
    const index = this.enrollments.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new NotFoundException(`Matrícula ${id} no encontrada`);
    }
    this.enrollments.splice(index, 1);
  }

  private async ensureCourseExists(courseId: number): Promise<void> { // CAMBIO: async
    // findOne ya lanza NotFoundException si el curso no existe
    await this.coursesService.findOne(String(courseId)); // CAMBIO: sin el if, con await + String()
  }
}