import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EnrollmentsService } from './enrollments.service.js';
import { EnrollmentsQueryDto } from './dto/enrollments-query.dto.js';
import { Enrollment } from './entities/enrollment.entity.js';
import { Student } from '../students/entities/student.entity.js';
import { Course } from '../courses/entities/course.entity.js';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let enrollmentsRepository: { createQueryBuilder: ReturnType<typeof vi.fn> };
  let queryBuilder: {
    leftJoinAndSelect: ReturnType<typeof vi.fn>;
    andWhere: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    skip: ReturnType<typeof vi.fn>;
    take: ReturnType<typeof vi.fn>;
    getManyAndCount: ReturnType<typeof vi.fn>;
    getMany: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: vi.fn(),
      andWhere: vi.fn(),
      orderBy: vi.fn(),
      skip: vi.fn(),
      take: vi.fn(),
      getManyAndCount: vi.fn(),
      getMany: vi.fn(),
    };
    for (const method of [
      queryBuilder.leftJoinAndSelect,
      queryBuilder.andWhere,
      queryBuilder.orderBy,
      queryBuilder.skip,
      queryBuilder.take,
    ]) {
      method.mockReturnValue(queryBuilder);
    }

    enrollmentsRepository = { createQueryBuilder: vi.fn() };
    enrollmentsRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        {
          provide: getRepositoryToken(Enrollment),
          useValue: enrollmentsRepository,
        },
        { provide: getRepositoryToken(Student), useValue: {} },
        { provide: getRepositoryToken(Course), useValue: {} },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('combines parameterized search and filters with stable pagination', async () => {
    const items = [
      {
        id: 3,
        student: { id: 2, name: 'Anabel', isActive: true },
        course: { id: 4, title: 'Análisis de APIs' },
      },
    ];
    queryBuilder.getManyAndCount.mockResolvedValue([items, 7]);
    const query = Object.assign(new EnrollmentsQueryDto(), {
      search: "nest' OR 1=1 --",
      studentId: 2,
      courseId: 4,
      activeOnly: 'true',
      page: 2,
      limit: 3,
    });

    await expect(service.findAll(query)).resolves.toEqual({
      items,
      meta: { total: 7, page: 2, limit: 3 },
    });
    expect(enrollmentsRepository.createQueryBuilder).toHaveBeenCalledWith(
      'enrollment',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenNthCalledWith(
      1,
      'enrollment.student',
      'student',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenNthCalledWith(
      2,
      'enrollment.course',
      'course',
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      '(student.name ILIKE :search OR course.title ILIKE :search)',
      { search: "%nest' OR 1=1 --%" },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      2,
      'student.id = :studentId',
      { studentId: 2 },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      3,
      'course.id = :courseId',
      { courseId: 4 },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      4,
      'student.isActive = :active',
      { active: true },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('enrollment.id', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(3);
    expect(queryBuilder.take).toHaveBeenCalledWith(3);
  });

  it('returns an empty paginated collection when no enrollments match', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await expect(service.findAll(new EnrollmentsQueryDto())).resolves.toEqual({
      items: [],
      meta: { total: 0, page: 1, limit: 10 },
    });
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
  });

  it('does not filter active status when activeOnly is false', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
    const query = Object.assign(new EnrollmentsQueryDto(), {
      activeOnly: 'false',
    });

    await service.findAll(query);

    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
  });
});