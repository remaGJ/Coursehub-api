import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateCourseUseCase } from './update-course.use-case.js';
import type { CourseRepository } from '../ports/course.repository.js';
import { Course } from '../entities/course.entity.js';
import { UserRole } from '../../users/user-role.enum.js';

describe('UpdateCourseUseCase', () => {
  let useCase: UpdateCourseUseCase;
  let mockRepository: CourseRepository;

  const existingCourse: Course = {
    id: 1,
    title: 'Clean Architecture with NestJS',
    level: 'intermediate',
    createdByUserId: 10,
    enrollments: [],
  };

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    useCase = new UpdateCourseUseCase(mockRepository);
    vi.restoreAllMocks();
  });

  it('allows ADMIN to update any course even if not the owner', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue({ ...existingCourse });
    vi.mocked(mockRepository.save).mockImplementation(async (c) => c);

    const admin = { id: 999, email: 'admin@example.com', role: UserRole.ADMIN };
    const result = await useCase.execute(1, { title: 'Updated Title' }, admin);

    expect(result.title).toBe('Updated Title');
    expect(mockRepository.findById).toHaveBeenCalledWith(1);
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, title: 'Updated Title' }),
    );
  });

  it('allows TEACHER owner to update their own course', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue({ ...existingCourse });
    vi.mocked(mockRepository.save).mockImplementation(async (c) => c);

    const owner = { id: 10, email: 'owner@example.com', role: UserRole.TEACHER };
    const result = await useCase.execute(1, { level: 'advanced' }, owner);

    expect(result.level).toBe('advanced');
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, level: 'advanced' }),
    );
  });

  it('throws ForbiddenException when a different TEACHER attempts to update the course', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue({ ...existingCourse });

    const otherTeacher = { id: 20, email: 'other@example.com', role: UserRole.TEACHER };

    await expect(
      useCase.execute(1, { title: 'Hacked Title' }, otherTeacher),
    ).rejects.toThrow(ForbiddenException);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when a STUDENT attempts to update the course', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue({ ...existingCourse });

    const student = { id: 30, email: 'student@example.com', role: UserRole.STUDENT };

    await expect(
      useCase.execute(1, { title: 'Hacked Title' }, student),
    ).rejects.toThrow(ForbiddenException);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the course does not exist', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue(null);

    const admin = { id: 999, email: 'admin@example.com', role: UserRole.ADMIN };

    await expect(
      useCase.execute(99, { title: 'New Title' }, admin),
    ).rejects.toThrow(NotFoundException);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
