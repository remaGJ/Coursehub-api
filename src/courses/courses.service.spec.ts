import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CoursesService } from './courses.service.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { Course } from './entities/course.entity.js';
import { UserRole } from '../users/user-role.enum.js';

describe('CoursesService', () => {
  let service: CoursesService;
  let coursesRepository: {
    findAndCount: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    coursesRepository = {
      findAndCount: vi.fn(),
      findOneBy: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
      remove: vi.fn(),
    };
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

  describe('update ownership & role matrix', () => {
    const existingCourse = {
      id: 1,
      title: 'NestJS Course',
      level: 'beginner',
      createdByUserId: 10,
    };

    beforeEach(() => {
      coursesRepository.findOneBy.mockResolvedValue({ ...existingCourse });
      coursesRepository.save.mockImplementation(async (c) => c);
    });

    it('allows admin to update any course (even if not owner)', async () => {
      const admin = { id: 999, email: 'admin@example.com', role: UserRole.ADMIN };
      const result = await service.update(1, { title: 'Updated' }, admin);

      expect(result.title).toBe('Updated');
      expect(coursesRepository.save).toHaveBeenCalled();
    });

    it('allows teacher owner to update their own course', async () => {
      const owner = { id: 10, email: 'teacher@example.com', role: UserRole.TEACHER };
      const result = await service.update(1, { title: 'Updated by owner' }, owner);

      expect(result.title).toBe('Updated by owner');
      expect(coursesRepository.save).toHaveBeenCalled();
    });

    it('throws ForbiddenException when another teacher tries to update course', async () => {
      const otherTeacher = { id: 20, email: 'other@example.com', role: UserRole.TEACHER };

      await expect(
        service.update(1, { title: 'Hack' }, otherTeacher),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when a student tries to update course', async () => {
      const student = { id: 30, email: 'student@example.com', role: UserRole.STUDENT };

      await expect(
        service.update(1, { title: 'Hack' }, student),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when course does not exist', async () => {
      coursesRepository.findOneBy.mockResolvedValue(null);
      const admin = { id: 999, email: 'admin@example.com', role: UserRole.ADMIN };

      await expect(
        service.update(99, { title: 'Hack' }, admin),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
