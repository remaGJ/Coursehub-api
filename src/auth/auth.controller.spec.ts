import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      register: vi.fn(),
      login: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates to authService.register and returns the created user', async () => {
    const dto = { email: 'user@example.com', password: 'password123' };
    const expectedResponse = {
      id: 1,
      email: 'user@example.com',
      createdAt: new Date(),
    };
    authService.register.mockResolvedValue(expectedResponse);

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toBe(expectedResponse);
  });

  it('delegates to authService.login and returns authenticated user data', async () => {
    const dto = { email: 'user@example.com', password: 'password123' };
    const expectedResponse = {
      accessToken: 'signed-jwt-token',
      user: {
        id: 1,
        email: 'user@example.com',
        createdAt: new Date(),
      },
    };
    authService.login.mockResolvedValue(expectedResponse);

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toBe(expectedResponse);
  });
});
