import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule, ObserveInstrument } from './app.module.js';
import { HttpErrorFilter } from './common/filters/http-error.filter.js';
import { TimingInterceptor } from './common/interceptors/timing.interceptor.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        instrument: ObserveInstrument,
    });

    app.enableCors({
        origin: ['http://localhost:5173', 'https://coursehub.example.edu'],
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.useGlobalFilters(new HttpErrorFilter());
    app.useGlobalInterceptors(new TimingInterceptor());

    const config = app.get(ConfigService);
    const port = config.getOrThrow<number>('PORT');

    await app.listen(port);
}

await bootstrap();
