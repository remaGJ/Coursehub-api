import { ConfigService } from '@nestjs/config';
import { createTypeOrmOptions } from './typeorm-options.js';

describe('createTypeOrmOptions', () => {
  it.each([
    { NODE_ENV: 'development', synchronize: true },
    { NODE_ENV: 'test', synchronize: false },
    { NODE_ENV: 'production', synchronize: false },
  ])(
    'sets synchronize=$synchronize for NODE_ENV=$NODE_ENV',
    ({ NODE_ENV, synchronize }) => {
      const config = new ConfigService({
        NODE_ENV,
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: 5432,
        DATABASE_USER: 'postgres',
        DATABASE_PASSWORD: 'test-only-password',
        DATABASE_NAME: 'coursehub_test',
      });

      const options = createTypeOrmOptions(config);

      expect(options.synchronize).toBe(synchronize);
      expect(options.autoLoadEntities).toBe(true);
    },
  );
});
