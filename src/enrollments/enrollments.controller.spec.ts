import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';
import { EnrollmentsQueryDto } from './dto/enrollments-query.dto.js';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  let enrollmentsService: { findAll: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    enrollmentsService = { findAll: vi.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        { provide: EnrollmentsService, useValue: enrollmentsService },
      ],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the query DTO to the service', () => {
    const query = new EnrollmentsQueryDto();

    controller.findAll(query);

    expect(enrollmentsService.findAll).toHaveBeenCalledWith(query);
  });
});