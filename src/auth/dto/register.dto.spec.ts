import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto.js';

describe('RegisterDto', () => {
  async function transformAndValidate(plain: Record<string, unknown>) {
    const dto = plainToInstance(RegisterDto, plain);
    const errors = await validate(dto);
    return { dto, errors };
  }

  it('transforms email to trimmed lowercase without altering password', async () => {
    const { dto, errors } = await transformAndValidate({
      email: '  Test.User@Example.COM  ',
      password: '  SecretPass123!  ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.email).toBe('test.user@example.com');
    expect(dto.password).toBe('  SecretPass123!  ');
  });

  it('rejects an invalid email format', async () => {
    const { errors } = await transformAndValidate({
      email: 'not-an-email',
      password: 'validPassword123',
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('rejects passwords shorter than 8 characters', async () => {
    const { errors } = await transformAndValidate({
      email: 'user@example.com',
      password: 'short',
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('rejects passwords longer than 72 characters', async () => {
    const { errors } = await transformAndValidate({
      email: 'user@example.com',
      password: 'a'.repeat(73),
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('accepts valid password with exactly 8 and 72 characters', async () => {
    const minResult = await transformAndValidate({
      email: 'user@example.com',
      password: '12345678',
    });
    expect(minResult.errors).toHaveLength(0);

    const maxResult = await transformAndValidate({
      email: 'user@example.com',
      password: 'a'.repeat(72),
    });
    expect(maxResult.errors).toHaveLength(0);
  });
});
