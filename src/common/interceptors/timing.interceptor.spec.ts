import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { TimingInterceptor } from './timing.interceptor.js';

describe('TimingInterceptor', () => {
  let interceptor: TimingInterceptor;

  beforeEach(() => {
    interceptor = new TimingInterceptor();
    vi.restoreAllMocks();
  });

  it('should measure response duration and log durationMs without altering result or logging body', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ body: { password: 'secretpassword' } }),
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ success: true, data: 'sample' }),
    };

    const observable = interceptor.intercept(mockContext, mockCallHandler);

    let result: unknown;
    await new Promise<void>((resolve) => {
      observable.subscribe({
        next: (val) => {
          result = val;
        },
        complete: () => resolve(),
      });
    });

    expect(result).toEqual({ success: true, data: 'sample' });
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const logged = consoleSpy.mock.calls[0][0];
    expect(logged).toHaveProperty('durationMs');
    expect(typeof logged.durationMs).toBe('number');
    expect(logged).not.toHaveProperty('body');
    expect(logged).not.toHaveProperty('password');
  });

  it('should not suppress errors thrown during handling', async () => {
    const mockContext = {} as ExecutionContext;
    const testError = new Error('Fallo de negocio');
    const mockCallHandler: CallHandler = {
      handle: () => throwError(() => testError),
    };

    const observable = interceptor.intercept(mockContext, mockCallHandler);

    await expect(
      new Promise((_, reject) => {
        observable.subscribe({
          error: (err) => reject(err),
        });
      }),
    ).rejects.toThrow('Fallo de negocio');
  });
});
