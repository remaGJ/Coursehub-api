import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('practice/error-500')
  triggerUnexpectedError(): never {
    throw new Error('Fallo crítico interno en base de datos: Error de conexión SQL');
  }
}
