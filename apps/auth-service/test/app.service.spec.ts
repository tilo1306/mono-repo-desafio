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
      expect(result).toMatch(/\/api\/auth\/avatar\/123e4567-e89b-12d3-a456-426614174000\/\d+-123e4567-e89b-12d3-a456-426614174000\.jpg/);
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
      expect(result).toMatch(/\/api\/auth\/avatar\/123e4567-e89b-12d3-a456-426614174000\/\d+-123e4567-e89b-12d3-a456-426614174000\.jpg/);
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
});
