import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpErrorFilter } from './http-error.filter.js';
import type { Request, Response } from 'express';

describe('HttpErrorFilter', () => {
  let filter: HttpErrorFilter;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpErrorFilter();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus as unknown as Response['status'],
    };

    mockRequest = {
      url: '/test-route',
      method: 'GET',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
        getNext: vi.fn(),
      }),
    } as unknown as ArgumentsHost;

    vi.restoreAllMocks();
  });

  it('should format HttpException (400 Bad Request) with consistent shape', () => {
    const exception = new BadRequestException('El campo nombre es requerido');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledTimes(1);

    const payload = mockJson.mock.calls[0][0];
    expect(payload.statusCode).toBe(400);
    expect(payload.path).toBe('/test-route');
    expect(payload.timestamp).toBeDefined();
    expect(payload.message).toEqual(exception.getResponse());
  });

  it('should format HttpException (404 Not Found) with consistent shape', () => {
    const exception = new NotFoundException('Recurso no encontrado');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledTimes(1);

    const payload = mockJson.mock.calls[0][0];
    expect(payload.statusCode).toBe(404);
    expect(payload.path).toBe('/test-route');
    expect(payload.timestamp).toBeDefined();
    expect(payload.message).toEqual(exception.getResponse());
  });

  it('should format unexpected error (500) hiding sensitive details from public response and logging internally', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const unexpectedError = new Error('SELECT * FROM users WHERE password_hash = "secret" FAILED');

    filter.catch(unexpectedError, mockHost);

    // 1. Debe responder con status 500
    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);

    // 2. La respuesta pública NO debe incluir la consulta SQL ni la traza del error
    const payload = mockJson.mock.calls[0][0];
    expect(payload.statusCode).toBe(500);
    expect(payload.path).toBe('/test-route');
    expect(payload.timestamp).toBeDefined();
    expect(payload.message).toBe('Internal server error');
    expect(JSON.stringify(payload)).not.toContain('SELECT * FROM users');
    expect(JSON.stringify(payload)).not.toContain('secret');

    // 3. Los registros internos deben capturar el detalle real para depuración
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[HttpErrorFilter] Internal Server Error'),
      unexpectedError,
    );
  });

  it('should hide details even if a 500 HttpException has sensitive response message', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exception = new HttpException('Sensitive DB error trace', HttpStatus.INTERNAL_SERVER_ERROR);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const payload = mockJson.mock.calls[0][0];
    expect(payload.message).toBe('Internal server error');
    expect(JSON.stringify(payload)).not.toContain('Sensitive DB error trace');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
