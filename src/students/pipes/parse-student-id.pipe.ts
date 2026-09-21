import {
    BadRequestException,
    Injectable,
    PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseStudentIdPipe implements PipeTransform {
    transform(value: string): number {
        const id = Number(value);

        if (!Number.isInteger(id) || id <= 0) {
            throw new BadRequestException(
                'El identificador del estudiante debe ser un número entero positivo',
            );
        }

        return id;
    }
}