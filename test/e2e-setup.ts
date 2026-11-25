const databasePassword = process.env.E2E_DATABASE_PASSWORD;

if (!databasePassword) {
  throw new Error(
    'E2E_DATABASE_PASSWORD must be set to connect to the isolated e2e database',
  );
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_HOST = process.env.E2E_DATABASE_HOST ?? '127.0.0.1';
process.env.DATABASE_PORT = process.env.E2E_DATABASE_PORT ?? '5432';
process.env.DATABASE_NAME = 'coursehub_e2e';
process.env.DATABASE_USER = process.env.E2E_DATABASE_USER ?? 'postgres';
process.env.DATABASE_PASSWORD = databasePassword;
process.env.JWT_SECRET = 'coursehub-e2e-only-secret-at-least-32-chars';
process.env.JWT_EXPIRES_IN = '5m';
