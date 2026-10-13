import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { Student } from './entities/student.entity.js';

@Injectable()
export class StudentsService {
    constructor(
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
    ) { }

    async findAll(
        career?: string,
        semester?: string,
        isActive?: string,
    ): Promise<Student[]> {
        const where: FindOptionsWhere<Student> = {};

        if (career) where.career = career;
        if (semester) where.semester = Number(semester);
        if (isActive !== undefined) where.isActive = isActive === 'true';

        return this.studentRepository.find({ where });
    }

    async findOne(id: number): Promise<Student> {
        const student = await this.studentRepository.findOneBy({ id });

        if (!student) {
            throw new NotFoundException('Estudiante no encontrado');
        }

        return student;
    }

    async create(input: CreateStudentDto): Promise<Student> {
        await this.ensureEmailAvailable(input.email);

        const student = this.studentRepository.create({
            ...input,
            isActive: input.isActive ?? true,
        });

        return this.studentRepository.save(student);
    }

    async update(id: number, input: UpdateStudentDto): Promise<Student> {
        const student = await this.findOne(id);

        if (input.email) {
            await this.ensureEmailAvailable(input.email, id);
        }

        Object.assign(student, input);

        return this.studentRepository.save(student);
    }

    async remove(id: number): Promise<Student> {
        const student = await this.findOne(id);

        if (!student.isActive) {
            throw new ConflictException(
                'No se puede eliminar un estudiante inactivo',
            );
        }

        return this.studentRepository.remove(student);
    }

    async toggleStatus(id: number): Promise<Student> {
        const student = await this.findOne(id);

        student.isActive = !student.isActive;

        return this.studentRepository.save(student);
    }

    private async ensureEmailAvailable(email: string, currentId?: number) {
        const existing = await this.studentRepository.findOneBy({ email });

        if (existing && existing.id !== currentId) {
            throw new ConflictException(
                'El correo electrónico ya está registrado',
            );
        }
    }
}