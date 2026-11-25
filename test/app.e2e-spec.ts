import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity.js';
import { AppModule } from '../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const email = 'e2e.student@coursehub.test';
  const password = 'E2eTestPassword123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.get(DataSource).getRepository(User).delete({ email });
  });

  it('serves the public root route', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Coursehub API esta en linea chavalon :D');
  });

  it('rejects access to the protected route without a token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('allows an authenticated user to access the protected route', async () => {
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const profile = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(profile.body).toMatchObject({
      id: registration.body.id,
      email,
      role: 'student',
    });
  });

  afterEach(async () => {
    if (app) {
      await app.get(DataSource).getRepository(User).delete({ email });
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
