import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CoursesQueryDto } from './courses-query.dto.js';

describe('CoursesQueryDto', () => {
  async function validateQuery(query: Record<string, string>) {
    const dto = plainToInstance(CoursesQueryDto, query);
    return { dto, errors: await validate(dto) };
  }

  it('uses defaults and transforms numeric and case-insensitive query values', async () => {
    const defaults = await validateQuery({});
    expect(defaults.errors).toHaveLength(0);
    expect(defaults.dto).toMatchObject({
      page: 1,
      limit: 10,
      sortBy: 'id',
      order: 'ASC',
    });

    const transformed = await validateQuery({
      page: '2',
      limit: '5',
      order: 'desc',
    });
    expect(transformed.errors).toHaveLength(0);
    expect(transformed.dto).toMatchObject({
      page: 2,
      limit: 5,
      order: 'DESC',
    });
  });

  it.each([
    { page: '0' },
    { limit: '200' },
    { sortBy: 'createdAt' },
    { order: 'sideways' },
  ])('rejects invalid query values: %o', async (query) => {
    const { errors } = await validateQuery(query);

    expect(errors.length).toBeGreaterThan(0);
  });
});
