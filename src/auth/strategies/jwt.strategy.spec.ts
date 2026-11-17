import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy.js';
import { JwtPayload } from '../types/jwt-payload.type.js';

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
    const payload: JwtPayload = { sub: 1, email: 'user@example.com' };
    const result = strategy.validate(payload);

    expect(result).toEqual({ id: 1, email: 'user@example.com' });
  });
});

