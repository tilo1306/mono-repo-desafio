import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { HashingService } from './hashing/hashing.service';
import { IUserRepository } from './repositories/user.repository.interface';

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'João Silva',
  email: 'joao@example.com',
  password: 'hashedPassword123',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const mockRegisterUserDTO = {
  name: 'João Silva',
  email: 'joao@example.com',
  password: 'plainPassword123',
};

const mockHashedPassword = 'hashedPassword123';

describe('AppService', () => {
  let service: AppService;
  let userRepository: jest.Mocked<IUserRepository>;
  let hashingService: any;

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const mockHashingService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: HashingService,
          useValue: mockHashingService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    userRepository = module.get('IUserRepository');
    hashingService = module.get<HashingService>(HashingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      hashingService.hash.mockResolvedValue(mockHashedPassword);
      userRepository.create.mockResolvedValue(mockUser);

      await service.register(mockRegisterUserDTO);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockRegisterUserDTO.email,
      );
      expect(hashingService.hash).toHaveBeenCalledWith('plainPassword123');
      expect(userRepository.create).toHaveBeenCalledWith({
        ...mockRegisterUserDTO,
        password: mockHashedPassword,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(mockRegisterUserDTO)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(mockRegisterUserDTO)).rejects.toThrow(
        'Email already exists',
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockRegisterUserDTO.email,
      );
      expect(hashingService.hash).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });
});
