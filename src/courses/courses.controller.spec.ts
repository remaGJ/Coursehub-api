import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { UpdateCourseUseCase } from './use-cases/update-course.use-case.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { UserRole } from '../users/user-role.enum.js';

describe('CoursesController', () => {
  let controller: CoursesController;
  let coursesService: {
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let updateCourseUseCase: {
    execute: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    coursesService = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    updateCourseUseCase = {
      execute: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: coursesService },
        { provide: UpdateCourseUseCase, useValue: updateCourseUseCase },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the query DTO to coursesService.findAll', () => {
    const query = new CoursesQueryDto();

    controller.findAll(query);

    expect(coursesService.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates findOne to coursesService with the parsed id', async () => {
    coursesService.findOne.mockResolvedValue({ id: 7, title: 'NestJS' });

    const result = await controller.findOne(7);

    expect(coursesService.findOne).toHaveBeenCalledWith(7);
    expect(result).toEqual({ id: 7, title: 'NestJS' });
  });

  it('delegates course creation to coursesService with dto and authenticated actor', async () => {
    const createDto = { title: 'New Course', level: 'beginner' };
    const actor = { id: 4, email: 'teacher@example.com', role: UserRole.TEACHER };
    const req = { user: actor } as any;
    coursesService.create.mockResolvedValue({ id: 1, ...createDto, createdByUserId: 4 });

    const result = await controller.create(createDto, req);

    expect(coursesService.create).toHaveBeenCalledWith(createDto, actor);
    expect(result).toEqual({ id: 1, ...createDto, createdByUserId: 4 });
  });

  it('delegates remove to coursesService with parsed id', async () => {
    coursesService.remove.mockResolvedValue({ id: 1, title: 'Deleted' });

    const result = await controller.remove(1);

    expect(coursesService.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1, title: 'Deleted' });
  });

  describe('update (PATCH /courses/:id)', () => {
    it('delegates update with the id, body and authenticated user to UpdateCourseUseCase', async () => {
      // Arrange: preparar entrada y simular retorno exitoso del caso de uso
      const actor = { id: 4, email: 'teacher@example.com', role: UserRole.TEACHER };
      const dto = { title: 'NestJS avanzado' };
      const req = { user: actor } as any;
      updateCourseUseCase.execute.mockResolvedValue({ id: 7, ...dto });

      // Act: ejecutar método del controlador
      const result = await controller.update(7, dto, req);

      // Assert: comprobar que el controlador preservó id, dto y actor
      expect(result).toEqual({ id: 7, ...dto });
      expect(updateCourseUseCase.execute).toHaveBeenCalledWith(7, dto, actor);
    });

    it('propagates errors thrown by UpdateCourseUseCase without swallowing them or returning a false 200', async () => {
      // Arrange: el caso de uso rechaza por regla de propiedad (403 Forbidden)
      const actor = { id: 9, email: 'other@example.com', role: UserRole.TEACHER };
      const dto = { title: 'Cambio no autorizado' };
      const req = { user: actor } as any;
      const forbiddenError = new ForbiddenException('You cannot modify this course');
      updateCourseUseCase.execute.mockRejectedValue(forbiddenError);

      // Act & Assert: el controlador debe propagar el error y no atraparlo como falso 200
      await expect(controller.update(7, dto, req)).rejects.toThrow(ForbiddenException);
      expect(updateCourseUseCase.execute).toHaveBeenCalledWith(7, dto, actor);
    });

    it('handles update delegation when request user is undefined', async () => {
      // Arrange: petición sin usuario autenticado en request
      const dto = { title: 'Actualización anónima' };
      const req = {} as any;
      updateCourseUseCase.execute.mockResolvedValue({ id: 1, title: 'Actualización anónima' });

      // Act
      const result = await controller.update(1, dto, req);

      // Assert
      expect(updateCourseUseCase.execute).toHaveBeenCalledWith(1, dto, undefined);
      expect(result).toEqual({ id: 1, title: 'Actualización anónima' });
    });
  });
});
