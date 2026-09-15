import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';

type Student = {
    id: number;
    Name: string;
    email: string;
    age: number;
    career: string;
    semester: number;
    isActive: boolean;
};

@Injectable()
export class StudentsService {
    private readonly students: Student[] = [
        {
            id: 1,
            Name: 'Carlos Eduardo Macias Rodriguez',
            email: 'carlos.macias@example.com',
            age: 21,
            career: 'Agropecuaria',
            semester: 5,
            isActive: true,
        },
        {
            id: 2,
            Name: 'José Antonio Zambrano Bazurto',
            email: 'jose.zb@example.com',
            age: 19,
            career: 'Ing Alimentos',
            semester: 2,
            isActive: false,
        },
        {
            id: 3,
            Name: 'Lucrecia Antonella Mero Cedeño',
            email: 'luluu.m@example.es',
            age: 18,
            career: 'Gastronomia',
            semester: 1,
            isActive: true,
        },
    ];

    findAll(
        career?: string,
        semester?: string,
        isActive?: string,
    ): Student[] {
        if (!career && !semester && isActive === undefined) {
            return this.students;
        }

        return this.students.filter(
            (student) =>
                (!career || student.career === career) &&
                (!semester ||
                    student.semester === Number(semester)) &&
                (isActive === undefined ||
                    student.isActive === (isActive === 'true')),
        );
    }

    findOne(id: number): Student {
        const student = this.students.find(
            (student) => student.id === id,
        );

        if (!student) {
            throw new NotFoundException(
                'Estudiante no encontrado',
            );
        }

        return student;
    }

    create(input: CreateStudentDto): Student {
        const emailExists = this.students.some(
            (student) => student.email === input.email,
        );

        if (emailExists) {
            throw new ConflictException(
                'El correo electrónico ya está registrado',
            );
        }

        const student: Student = {
            id:
                Math.max(
                    0,
                    ...this.students.map((item) => item.id),
                ) + 1,

            Name: input.Name,
            email: input.email,
            age: input.age,
            career: input.career,
            semester: input.semester,
            isActive: input.isActive ?? true,
        };

        this.students.push(student);

        return student;
    }

    update(
        id: number,
        input: UpdateStudentDto,
    ): Student {
        const student = this.findOne(id);

        if (input.email) {
            const emailExists = this.students.some(
                (item) =>
                    item.email === input.email &&
                    item.id !== id,
            );

            if (emailExists) {
                throw new ConflictException(
                    'El correo electrónico ya está registrado por otro estudiante',
                );
            }
        }

        Object.assign(student, input);

        return student;
    }

    remove(id: number): Student {
        const student = this.findOne(id);

        if (!student.isActive) {
            throw new ConflictException(
                'No se puede eliminar un estudiante inactivo',
            );
        }

        const index = this.students.findIndex(
            (student) => student.id === id,
        );

        const [removedStudent] = this.students.splice(
            index,
            1,
        );

        return removedStudent;
    }

    toggleStatus(id: number): Student {
        const student = this.findOne(id);

        student.isActive = !student.isActive;

        return student;
    }
}