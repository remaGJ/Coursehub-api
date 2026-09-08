import { Injectable } from '@nestjs/common';

@Injectable()
export class WelcomeService {
    getMessage(): string {
        return 'Bienvenido a Coursehub API :v';
    }
}