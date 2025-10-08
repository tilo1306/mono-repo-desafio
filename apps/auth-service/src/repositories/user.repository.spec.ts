import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRepository } from './user.repository';

// Mock data
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

describe('UserRepository', () => {
  let repository: UserRepository;
  let typeOrmRepository: any;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    typeOrmRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      // Arrange
      typeOrmRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await repository.findByEmail(mockUser.email);

      // Assert
      expect(result).toEqual(mockUser);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });

    it('should return null when email does not exist', async () => {
      // Arrange
      typeOrmRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });
  });

  describe('create', () => {
    it('should create and save user successfully', async () => {
      // Arrange
      const userData = { ...mockRegisterUserDTO, password: 'hashedPassword' };
      const createdUser = { ...mockUser, ...userData };

      typeOrmRepository.create.mockReturnValue(createdUser);
      typeOrmRepository.save.mockResolvedValue(createdUser);

      // Act
      const result = await repository.create(userData);

      // Assert
      expect(result).toEqual(createdUser);
      expect(typeOrmRepository.create).toHaveBeenCalledWith(userData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(createdUser);
    });
  });
});
