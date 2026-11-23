import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the query DTO to the service', () => {
    const query = new CoursesQueryDto();

    controller.findAll(query);

    expect(coursesService.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates remove to coursesService with parsed id', async () => {
    coursesService.remove.mockResolvedValue({ id: 1, title: 'Deleted' });

    const result = await controller.remove(1);

    expect(coursesService.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1, title: 'Deleted' });
  });

  it('delegates update to updateCourseUseCase with id, dto and actor', async () => {
    const dto = { title: 'New Title' };
    const user = { id: 1, email: 'admin@example.com', role: UserRole.ADMIN };
    const req = { user } as any;
    updateCourseUseCase.execute.mockResolvedValue({ id: 1, title: 'New Title' });

    const result = await controller.update(1, dto, req);

    expect(updateCourseUseCase.execute).toHaveBeenCalledWith(1, dto, user);
    expect(result).toEqual({ id: 1, title: 'New Title' });
  });
});
