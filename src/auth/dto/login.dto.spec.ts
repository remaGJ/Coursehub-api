import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto.js';

describe('LoginDto', () => {
  async function transformAndValidate(plain: Record<string, unknown>) {
    const dto = plainToInstance(LoginDto, plain);
    const errors = await validate(dto);
    return { dto, errors };
  }

  it('transforms email to trimmed lowercase without altering password', async () => {
    const { dto, errors } = await transformAndValidate({
      email: '  User.Login@Example.COM  ',
      password: '  SecretPass123!  ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.email).toBe('user.login@example.com');
    expect(dto.password).toBe('  SecretPass123!  ');
  });

  it('rejects an invalid email format', async () => {
    const { errors } = await transformAndValidate({
      email: 'invalid-email',
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

  it('accepts valid credentials with exact boundary lengths', async () => {
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
