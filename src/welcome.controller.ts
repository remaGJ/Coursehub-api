import { Controller, Get } from '@nestjs/common';
import { WelcomeService } from './welcome.service.js';

@Controller('welcome')
export class WellcomeController {
    constructor(private readonly welcomeService: WelcomeService) {}

    @Get()
    getWellcome(): string {
        return this.welcomeService.getMessage();
    }
}