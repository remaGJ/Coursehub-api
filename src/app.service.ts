import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Coursehub API esta en linea chavalon :D';
  }
}
