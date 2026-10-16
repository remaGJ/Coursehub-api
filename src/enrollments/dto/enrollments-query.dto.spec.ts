import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EnrollmentsQueryDto } from './enrollments-query.dto.js';

describe('EnrollmentsQueryDto', () => {
  async function validateQuery(query: Record<string, string>) {
    const dto = plainToInstance(EnrollmentsQueryDto, query);
    return { dto, errors: await validate(dto) };
  }

  it('transforms numeric filters and supplies pagination defaults', async () => {
    const { dto, errors } = await validateQuery({
      studentId: '2',
      courseId: '3',
      page: '2',
      limit: '5',
      activeOnly: 'true',
    });

    expect(errors).toHaveLength(0);
    expect(dto).toMatchObject({
      studentId: 2,
      courseId: 3,
      page: 2,
      limit: 5,
      activeOnly: 'true',
    });

    const defaults = await validateQuery({});
    expect(defaults.errors).toHaveLength(0);
    expect(defaults.dto).toMatchObject({ page: 1, limit: 10 });
  });

  it.each([
    { studentId: '0' },
    { courseId: 'not-a-number' },
    { activeOnly: 'yes' },
    { page: '0' },
    { limit: '51' },
  ])('rejects invalid query values: %o', async (query) => {
    const { errors } = await validateQuery(query);

    expect(errors.length).toBeGreaterThan(0);
  });
});
