import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findByEmailWithPassword: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      findByEmailWithPassword: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('hashes password with bcrypt and returns safe user data', async () => {
      const now = new Date();
      usersService.create.mockImplementation(async (email, passwordHash) => ({
        id: 1,
        email,
        passwordHash,
        createdAt: now,
      }));

      const result = await service.register({
        email: 'user@example.com',
        password: 'securePassword123',
      });

      expect(usersService.create).toHaveBeenCalledTimes(1);
      const [emailArg, hashArg] = usersService.create.mock.calls[0];
      expect(emailArg).toBe('user@example.com');
      expect(hashArg).not.toBe('securePassword123');
      expect(hashArg.startsWith('$2b$12$')).toBe(true);

      expect(result).toEqual({
        id: 1,
        email: 'user@example.com',
        createdAt: now,
      });
      expect((result as any).passwordHash).toBeUndefined();
    });
  });

  describe('login', () => {
    it('authenticates user and returns sanitized profile when credentials are valid', async () => {
      const now = new Date();
      const password = 'validPassword123';
      const hash = await (await import('bcrypt')).hash(password, 10);

      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        passwordHash: hash,
        createdAt: now,
      });

      const result = await service.login({
        email: 'user@example.com',
        password,
      });

      expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith(
        'user@example.com',
      );
      expect(result).toEqual({
        id: 1,
        email: 'user@example.com',
        createdAt: now,
      });
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('throws UnauthorizedException when password is incorrect', async () => {
      const hash = await (await import('bcrypt')).hash('correctPassword', 10);

      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        passwordHash: hash,
        createdAt: new Date(),
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
