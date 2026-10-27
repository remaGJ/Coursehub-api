import { environmentValidationSchema } from './environment.validation.js';

const requiredDatabaseConfig = {
  DATABASE_HOST: 'localhost',
  DATABASE_NAME: 'coursehub',
  DATABASE_USER: 'postgres',
  DATABASE_PASSWORD: '',
  JWT_SECRET: 'a'.repeat(32),
};

describe('environmentValidationSchema', () => {
  it('applies defaults and allows an empty password in development', () => {
    const { error, value } = environmentValidationSchema.validate(
      requiredDatabaseConfig,
    );

    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_PORT: 5432,
      DATABASE_PASSWORD: '',
      JWT_SECRET: 'a'.repeat(32),
      JWT_EXPIRES_IN: '15m',
    });
  });

  it('rejects missing JWT_SECRET', () => {
    const configWithoutSecret = { ...requiredDatabaseConfig };
    delete (configWithoutSecret as any).JWT_SECRET;
    const { error } = environmentValidationSchema.validate(configWithoutSecret);

    expect(error).toBeDefined();
    expect(error?.message).toContain('"JWT_SECRET" is required');
  });

  it('rejects JWT_SECRET shorter than 32 characters', () => {
    const { error } = environmentValidationSchema.validate({
      ...requiredDatabaseConfig,
      JWT_SECRET: 'too-short-secret',
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('at least 32 characters long');
  });

  it.each(['test', 'production'])(
    'requires a non-empty password in %s',
    (NODE_ENV) => {
      const { error } = environmentValidationSchema.validate({
        ...requiredDatabaseConfig,
        NODE_ENV,
      });

      expect(error).toBeDefined();
    },
  );

  it.each(['development', 'test', 'production'])(
    'accepts the %s environment',
    (NODE_ENV) => {
      const { error } = environmentValidationSchema.validate({
        ...requiredDatabaseConfig,
        DATABASE_PASSWORD: 'local-password',
        NODE_ENV,
      });

      expect(error).toBeUndefined();
    },
  );

  it('rejects unsupported environments', () => {
    const { error } = environmentValidationSchema.validate({
      ...requiredDatabaseConfig,
      NODE_ENV: 'staging',
    });

    expect(error).toBeDefined();
  });

  it('rejects invalid ports', () => {
    const { error } = environmentValidationSchema.validate({
      ...requiredDatabaseConfig,
      PORT: 65536,
    });

    expect(error).toBeDefined();
  });

  it('requires database connection settings', () => {
    const { error } = environmentValidationSchema.validate({
      ...requiredDatabaseConfig,
      DATABASE_HOST: undefined,
    });

    expect(error).toBeDefined();
  });
});
