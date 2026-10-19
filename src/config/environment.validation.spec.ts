import { environmentValidationSchema } from './environment.validation.js';

const requiredDatabaseConfig = {
  DATABASE_HOST: 'localhost',
  DATABASE_NAME: 'coursehub',
  DATABASE_USER: 'postgres',
  DATABASE_PASSWORD: '',
};

describe('environmentValidationSchema', () => {
  it('applies defaults and allows an empty password in development', () => {
    const { error, value } =
      environmentValidationSchema.validate(requiredDatabaseConfig);

    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_PORT: 5432,
      DATABASE_PASSWORD: '',
    });
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
