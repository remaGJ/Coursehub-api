import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';

describe('CoursesController', () => {
  let controller: CoursesController;
  let coursesService: { findAll: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    coursesService = { findAll: vi.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: coursesService }],
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
});