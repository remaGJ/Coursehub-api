import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy.js';
import { JwtPayload } from '../types/jwt-payload.type.js';
import { UserRole } from '../../users/user-role.enum.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: { getOrThrow: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    configService = {
      getOrThrow: vi.fn().mockReturnValue('super-secret-development-key-that-is-at-least-32-chars-long'),
    };
    strategy = new JwtStrategy(configService as unknown as ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('validates and returns AuthenticatedUser from jwt payload', () => {
    const payload: JwtPayload = { sub: 1, email: 'user@example.com', role: UserRole.ADMIN };
    const result = strategy.validate(payload);

    expect(result).toEqual({ id: 1, email: 'user@example.com', role: UserRole.ADMIN });
  });

  it('defaults role to STUDENT if not present in payload', () => {
    const payload: JwtPayload = { sub: 2, email: 'student@example.com' };
    const result = strategy.validate(payload);

    expect(result).toEqual({ id: 2, email: 'student@example.com', role: UserRole.STUDENT });
  });
});
