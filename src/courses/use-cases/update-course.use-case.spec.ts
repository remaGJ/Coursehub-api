import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateCourseUseCase } from './update-course.use-case.js';
import { COURSE_REPOSITORY } from '../ports/course.repository.js';
import { Course } from '../entities/course.entity.js';
import { UserRole } from '../../users/user-role.enum.js';

describe('UpdateCourseUseCase', () => {
  let useCase: UpdateCourseUseCase;
  let courses: {
    findById: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    courses = {
      findById: vi.fn(),
      save: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCourseUseCase,
        { provide: COURSE_REPOSITORY, useValue: courses },
      ],
    }).compile();

    useCase = module.get<UpdateCourseUseCase>(UpdateCourseUseCase);
    vi.clearAllMocks();
  });

  // 1. Caso de Éxito: Docente propietario
  it('allows the owner teacher to update a course', async () => {
    // Arrange: preparar entrada y repositorio simulado
    const course = {
      id: 7,
      title: 'NestJS',
      level: 'beginner',
      createdByUserId: 4,
      enrollments: [],
    } as Course;
    courses.findById.mockResolvedValue(course);
    courses.save.mockImplementation(async (value) => value);

    // Act: ejecutar la unidad bajo prueba
    const result = await useCase.execute(
      7,
      { title: 'NestJS avanzado' },
      { id: 4, email: 'teacher@example.com', role: UserRole.TEACHER },
    );

    // Assert: verificar resultado y persistencia
    expect(result.title).toBe('NestJS avanzado');
    expect(courses.save).toHaveBeenCalledWith(course);
  });

  // 2. Caso de Recurso Inexistente (404)
  it('throws NotFoundException when the course does not exist', async () => {
    // Arrange: simular que el curso no se encuentra
    courses.findById.mockResolvedValue(null);

    // Act & Assert: verificar excepción y que nunca se intente guardar
    await expect(
      useCase.execute(
        99,
        { title: 'Cambio' },
        { id: 4, email: 'teacher@example.com', role: UserRole.TEACHER },
      ),
    ).rejects.toThrow(NotFoundException);

    expect(courses.save).not.toHaveBeenCalled();
  });

  // 3. Caso de Rechazo por Regla: Docente ajeno (403)
  it('rejects an update from a different teacher', async () => {
    // Arrange: curso propiedad del docente con id 4
    courses.findById.mockResolvedValue({
      id: 7,
      title: 'NestJS',
      level: 'beginner',
      createdByUserId: 4,
      enrollments: [],
    } as Course);

    // Act & Assert: docente con id 9 es rechazado y no se guarda ningún cambio
    await expect(
      useCase.execute(
        7,
        { title: 'Cambio' },
        { id: 9, email: 'other@example.com', role: UserRole.TEACHER },
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(courses.save).not.toHaveBeenCalled();
  });

  // Regla adicional: Administrador puede actualizar cualquier curso
  it('allows ADMIN to update any course even if not the owner', async () => {
    // Arrange
    const course = {
      id: 7,
      title: 'NestJS',
      level: 'beginner',
      createdByUserId: 4,
      enrollments: [],
    } as Course;
    courses.findById.mockResolvedValue(course);
    courses.save.mockImplementation(async (value) => value);

    // Act
    const result = await useCase.execute(
      7,
      { title: 'Actualizado por Admin' },
      { id: 999, email: 'admin@example.com', role: UserRole.ADMIN },
    );

    // Assert
    expect(result.title).toBe('Actualizado por Admin');
    expect(courses.save).toHaveBeenCalledWith(course);
  });
});
