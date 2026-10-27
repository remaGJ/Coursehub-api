import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    findOneBy: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let queryBuilder: {
    addSelect: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    getOne: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    queryBuilder = {
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getOne: vi.fn(),
    };

    usersRepository = {
      findOneBy: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('queries repository by email', async () => {
      const user = { id: 1, email: 'user@example.com' };
      usersRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findByEmail('user@example.com');
      expect(result).toBe(user);
      expect(usersRepository.findOneBy).toHaveBeenCalledWith({
        email: 'user@example.com',
      });
    });
  });

  describe('findByEmailWithPassword', () => {
    it('queries repository using QueryBuilder selecting passwordHash', async () => {
      const userWithHash = {
        id: 1,
        email: 'user@example.com',
        passwordHash: 'hash123',
      };
      queryBuilder.getOne.mockResolvedValue(userWithHash);

      const result = await service.findByEmailWithPassword('user@example.com');

      expect(usersRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
      expect(queryBuilder.where).toHaveBeenCalledWith('user.email = :email', {
        email: 'user@example.com',
      });
      expect(queryBuilder.getOne).toHaveBeenCalledTimes(1);
      expect(result).toBe(userWithHash);
    });
  });

  describe('create', () => {
    it('creates and saves a new user when email does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);
      const userEntity = {
        id: 1,
        email: 'new@example.com',
        passwordHash: 'hash123',
      };
      usersRepository.create.mockReturnValue(userEntity);
      usersRepository.save.mockResolvedValue(userEntity);

      const result = await service.create('new@example.com', 'hash123');

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({
        email: 'new@example.com',
      });
      expect(usersRepository.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        passwordHash: 'hash123',
      });
      expect(usersRepository.save).toHaveBeenCalledWith(userEntity);
      expect(result).toBe(userEntity);
    });

    it('throws ConflictException when email is already registered', async () => {
      usersRepository.findOneBy.mockResolvedValue({
        id: 1,
        email: 'exists@example.com',
      });

      await expect(
        service.create('exists@example.com', 'hash123'),
      ).rejects.toThrow('Email already registered');
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });
});
