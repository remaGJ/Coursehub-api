import { Module } from '@nestjs/common';

import { StudentsController } from './students.controller.js';
import { StudentsService } from './students.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([Student])],
    controllers: [StudentsController],
    providers: [StudentsService],
    exports: [StudentsService],
})
export class StudentsModule { }