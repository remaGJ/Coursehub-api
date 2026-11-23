import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Repository } from 'typeorm';
import { TypeOrmCourseRepository } from './typeorm-course.repository.js';
import { Course } from '../entities/course.entity.js';

describe('TypeOrmCourseRepository', () => {
  let adapter: TypeOrmCourseRepository;
  let mockTypeOrmRepo: {
    findOneBy: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOneBy: vi.fn(),
      save: vi.fn(),
    };
    adapter = new TypeOrmCourseRepository(
      mockTypeOrmRepo as unknown as Repository<Course>,
    );
  });

  it('findById delegates to repository.findOneBy with id', async () => {
    const course = { id: 1, title: 'Course 1' } as Course;
    mockTypeOrmRepo.findOneBy.mockResolvedValue(course);

    const result = await adapter.findById(1);

    expect(mockTypeOrmRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(result).toBe(course);
  });

  it('save delegates to repository.save with course entity', async () => {
    const course = { id: 1, title: 'Updated' } as Course;
    mockTypeOrmRepo.save.mockResolvedValue(course);

    const result = await adapter.save(course);

    expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(course);
    expect(result).toBe(course);
  });
});
