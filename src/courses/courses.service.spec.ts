import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoursesService } from './courses.service.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { Course } from './entities/course.entity.js';

describe('CoursesService', () => {
  let service: CoursesService;
  let coursesRepository: { findAndCount: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    coursesRepository = { findAndCount: vi.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: coursesRepository },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns a filtered and sorted page with pagination metadata', async () => {
    const items = [{ id: 6, title: 'NestJS', level: 'beginner' }];
    coursesRepository.findAndCount.mockResolvedValue([items, 12]);
    const query = Object.assign(new CoursesQueryDto(), {
      level: 'beginner',
      page: 2,
      limit: 5,
      sortBy: 'title' as const,
      order: 'ASC' as const,
    });

    await expect(service.findAll(query)).resolves.toEqual({
      items,
      meta: { total: 12, page: 2, limit: 5, totalPages: 3 },
    });
    expect(coursesRepository.findAndCount).toHaveBeenCalledWith({
      where: { level: 'beginner' },
      order: { title: 'ASC' },
      skip: 5,
      take: 5,
    });
  });

  it('uses defaults and does not add a level filter when none is provided', async () => {
    coursesRepository.findAndCount.mockResolvedValue([[], 0]);

    await expect(service.findAll(new CoursesQueryDto())).resolves.toEqual({
      items: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
    expect(coursesRepository.findAndCount).toHaveBeenCalledWith({
      where: {},
      order: { id: 'ASC' },
      skip: 0,
      take: 10,
    });
  });
});
