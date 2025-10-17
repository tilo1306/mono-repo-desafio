import { RpcException } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '../src/app.service';
import { HashingService } from '../src/hashing/hashing.service';
import { AuthJwtService } from '../src/jwt/jwt.service';
import { IUserRepository } from '../src/repositories/user.repository.interface';

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'João Silva',
  email: 'joao@example.com',
  password: 'hashedPassword123',
  avatar: 'https://robohash.org/joao@example.com',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const mockRegisterUserDTO = {
  name: 'João Silva',
  email: 'joao@example.com',
  password: 'plainPassword123',
};

const mockHashedPassword = 'hashedPassword123';

const mockLoginUserDTO = {
  email: 'joao@example.com',
  password: 'plainPassword123',
};

const mockRefreshTokenDTO = {
  refreshToken: 'mock-refresh-token',
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

describe('AppService', () => {
  let service: AppService;
  let userRepository: jest.Mocked<IUserRepository>;
  let hashingService: any;
  let authJwtService: any;

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findManyPaginated: jest.fn(),
    };

    const mockHashingService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const mockAuthJwtService = {
      generateTokens: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    const mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
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
        {
          provide: AuthJwtService,
          useValue: mockAuthJwtService,
        },
        {
          provide: 'winston',
          useValue: mockWinstonLogger,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    userRepository = module.get('IUserRepository');
    hashingService = module.get<HashingService>(HashingService);
    authJwtService = module.get<AuthJwtService>(AuthJwtService);
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
        avatar: expect.stringContaining('robohash.org'),
      });
    });

    it('should throw RpcException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(mockRegisterUserDTO)).rejects.toThrow(
        RpcException,
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

  describe('login', () => {
    it('should login successfully and return tokens with user data', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(true);
      authJwtService.generateTokens.mockResolvedValue(mockTokens);

      const result = await service.login(mockLoginUserDTO);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockLoginUserDTO.email,
      );
      expect(hashingService.compare).toHaveBeenCalledWith(
        mockLoginUserDTO.password,
        mockUser.password,
      );
      expect(authJwtService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockTokens);
    });

    it('should throw RpcException when user does not exist', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(mockLoginUserDTO)).rejects.toThrow(
        RpcException,
      );
      await expect(service.login(mockLoginUserDTO)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockLoginUserDTO.email,
      );
      expect(hashingService.compare).not.toHaveBeenCalled();
      expect(authJwtService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw RpcException when password is invalid', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.login(mockLoginUserDTO)).rejects.toThrow(
        RpcException,
      );
      await expect(service.login(mockLoginUserDTO)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        mockLoginUserDTO.email,
      );
      expect(hashingService.compare).toHaveBeenCalledWith(
        mockLoginUserDTO.password,
        mockUser.password,
      );
      expect(authJwtService.generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const mockPayload = { sub: mockUser.id, email: mockUser.email };
      authJwtService.verifyRefreshToken.mockResolvedValue(mockPayload);
      userRepository.findById.mockResolvedValue(mockUser);
      authJwtService.generateTokens.mockResolvedValue(mockTokens);

      const result = await service.refreshToken(mockRefreshTokenDTO);

      expect(authJwtService.verifyRefreshToken).toHaveBeenCalledWith(
        mockRefreshTokenDTO.refreshToken,
      );
      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(authJwtService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockTokens);
    });

    it('should throw RpcException when refresh token is invalid', async () => {
      authJwtService.verifyRefreshToken.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(service.refreshToken(mockRefreshTokenDTO)).rejects.toThrow(
        RpcException,
      );
      await expect(service.refreshToken(mockRefreshTokenDTO)).rejects.toThrow(
        'Error refreshing token',
      );

      expect(authJwtService.verifyRefreshToken).toHaveBeenCalledWith(
        mockRefreshTokenDTO.refreshToken,
      );
      expect(userRepository.findById).not.toHaveBeenCalled();
      expect(authJwtService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw RpcException when user is not found', async () => {
      const mockPayload = { sub: mockUser.id, email: mockUser.email };
      authJwtService.verifyRefreshToken.mockResolvedValue(mockPayload);
      userRepository.findById.mockResolvedValue(null);

      await expect(service.refreshToken(mockRefreshTokenDTO)).rejects.toThrow(
        RpcException,
      );
      await expect(service.refreshToken(mockRefreshTokenDTO)).rejects.toThrow(
        'Error refreshing token',
      );

      expect(authJwtService.verifyRefreshToken).toHaveBeenCalledWith(
        mockRefreshTokenDTO.refreshToken,
      );
      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(authJwtService.generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('profile', () => {
    it('should return user profile successfully', async () => {
      const mockUserWithAvatar = {
        ...mockUser,
        avatar: 'https://example.com/avatar.jpg',
      };
      userRepository.findById.mockResolvedValue(mockUserWithAvatar);

      const result = await service.profile(mockUser.id);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        name: mockUser.name,
        email: mockUser.email,
        avatar: mockUserWithAvatar.avatar,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.profile(mockUser.id)).rejects.toThrow(
        'User not found',
      );

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('avatar', () => {
    const mockFile = {
      originalname: 'avatar.jpg',
      buffer: Buffer.from('fake-image-data'),
    };

    beforeEach(() => {
      jest.mock('fs', () => ({
        existsSync: jest.fn(),
        mkdirSync: jest.fn(),
        writeFileSync: jest.fn(),
        unlinkSync: jest.fn(),
      }));
    });

    it('should upload avatar successfully for new user', async () => {
      const mockUserWithoutAvatar = {
        ...mockUser,
        avatar: 'https://robohash.org/test@example.com',
      };
      userRepository.findById.mockResolvedValue(mockUserWithoutAvatar);
      userRepository.update.mockResolvedValue({
        ...mockUserWithoutAvatar,
        avatar: '/api/auth/avatar/123/1640995200000-123.jpg',
      });

      const result = await service.avatar(mockUser.id, mockFile);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        avatar: expect.stringContaining('/api/auth/avatar/'),
      });
      expect(result).toMatchObject({
        avatarUrl: expect.stringMatching(/\/api\/auth\/avatar\/123e4567-e89b-12d3-a456-426614174000\/\d+-123e4567-e89b-12d3-a456-426614174000\.jpg/)
      });
    });

    it('should replace existing avatar successfully', async () => {
      const mockUserWithAvatar = {
        ...mockUser,
        avatar: '/api/auth/avatar/123/1640995100000-123.jpg',
      };
      userRepository.findById.mockResolvedValue(mockUserWithAvatar);
      userRepository.update.mockResolvedValue({
        ...mockUserWithAvatar,
        avatar: '/api/auth/avatar/123/1640995200000-123.jpg',
      });

      const result = await service.avatar(mockUser.id, mockFile);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        avatar: expect.stringContaining('/api/auth/avatar/'),
      });
      expect(result).toMatchObject({
        avatarUrl: expect.stringMatching(/\/api\/auth\/avatar\/123e4567-e89b-12d3-a456-426614174000\/\d+-123e4567-e89b-12d3-a456-426614174000\.jpg/)
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.avatar(mockUser.id, mockFile)).rejects.toThrow(
        'User not found',
      );

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    const mockUpdatePasswordDTO = {
      password: 'currentPassword123',
      newPassword: 'newPassword123',
    };

    it('should update password successfully', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedCurrentPassword',
      };
      
      userRepository.findById.mockResolvedValue(mockUserWithPassword);
      hashingService.compare.mockResolvedValue(true);
      hashingService.hash.mockResolvedValue('hashedNewPassword');
      userRepository.update.mockResolvedValue(mockUserWithPassword);

      await service.updatePassword(mockUser.id, mockUpdatePasswordDTO);

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(hashingService.compare).toHaveBeenCalledWith(
        mockUpdatePasswordDTO.password,
        mockUserWithPassword.password,
      );
      expect(hashingService.hash).toHaveBeenCalledWith(mockUpdatePasswordDTO.newPassword);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        password: 'hashedNewPassword',
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.updatePassword(mockUser.id, mockUpdatePasswordDTO)).rejects.toThrow(
        'User not found',
      );

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(hashingService.compare).not.toHaveBeenCalled();
      expect(hashingService.hash).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when current password is invalid', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedCurrentPassword',
      };
      
      userRepository.findById.mockResolvedValue(mockUserWithPassword);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.updatePassword(mockUser.id, mockUpdatePasswordDTO)).rejects.toThrow(
        'Invalid password',
      );

      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(hashingService.compare).toHaveBeenCalledWith(
        mockUpdatePasswordDTO.password,
        mockUserWithPassword.password,
      );
      expect(hashingService.hash).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('users', () => {
    const mockUsers = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'hashedPassword123',
        avatar: 'https://robohash.org/joao@example.com',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: '456e7890-e89b-12d3-a456-426614174001',
        name: 'Maria Santos',
        email: 'maria@example.com',
        password: 'hashedPassword456',
        avatar: 'https://robohash.org/maria@example.com',
        createdAt: new Date('2024-01-02T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      },
    ];

    it('should return paginated list of users successfully', async () => {
      const mockPaginatedResult = {
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      userRepository.findManyPaginated.mockResolvedValue(mockPaginatedResult);

      const requestUsersDTO = {
        page: 1,
        limit: 10,
      };

      const result = await service.users(requestUsersDTO);

      expect(userRepository.findManyPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        email: undefined,
      });
      expect(result).toEqual({
        data: [
          {
            name: 'João Silva',
            email: 'joao@example.com',
            avatar: 'https://robohash.org/joao@example.com',
          },
          {
            name: 'Maria Santos',
            email: 'maria@example.com',
            avatar: 'https://robohash.org/maria@example.com',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should filter users by email when provided', async () => {
      const mockPaginatedResult = {
        data: [mockUsers[0]],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      userRepository.findManyPaginated.mockResolvedValue(mockPaginatedResult);

      const requestUsersDTO = {
        page: 1,
        limit: 10,
        email: 'joao',
      };

      const result = await service.users(requestUsersDTO);

      expect(userRepository.findManyPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        email: 'joao',
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('joao@example.com');
    });

    it('should return empty array when no users exist', async () => {
      const mockPaginatedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      userRepository.findManyPaginated.mockResolvedValue(mockPaginatedResult);

      const requestUsersDTO = {
        page: 1,
        limit: 10,
      };

      const result = await service.users(requestUsersDTO);

      expect(userRepository.findManyPaginated).toHaveBeenCalledTimes(1);
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const mockPaginatedResult = {
        data: [mockUsers[1]],
        total: 2,
        page: 2,
        limit: 1,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      };

      userRepository.findManyPaginated.mockResolvedValue(mockPaginatedResult);

      const requestUsersDTO = {
        page: 2,
        limit: 1,
      };

      const result = await service.users(requestUsersDTO);

      expect(userRepository.findManyPaginated).toHaveBeenCalledWith({
        page: 2,
        limit: 1,
        email: undefined,
      });
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(1);
      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(true);
    });

    it('should use default values when not provided', async () => {
      const mockPaginatedResult = {
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      userRepository.findManyPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await service.users({});

      expect(userRepository.findManyPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        email: undefined,
      });
    });
  });
});
