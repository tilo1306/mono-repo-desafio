import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { of, throwError } from 'rxjs';
import { AuthController } from '../src/modules/auth/auth.controller';
import { RequestRegisterDTO } from '../src/modules/auth/dto/request/request-register.dto';
import { RequestLoginDTO } from '../src/modules/auth/dto/request/request-login.dto';
import { RequestRefreshTokenDTO } from '../src/modules/auth/dto/request/request-refresh-token.dto';
import { RequestUpdatePasswordDTO } from '../src/modules/auth/dto/request/request-update-password.dto';
import { RequestUsersQueryDTO } from '../src/modules/auth/dto/request/request-users-query.dto';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authClient: jest.Mocked<ClientProxy>;
  let logger: jest.Mocked<Logger>;

  const mockRequest = {
    cookies: {} as any,
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  beforeEach(async () => {
    const mockAuthClient = {
      send: jest.fn(),
    };

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: 'AUTH_SERVICE', useValue: mockAuthClient },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authClient = module.get('AUTH_SERVICE');
    logger = module.get(WINSTON_MODULE_PROVIDER);

    jest.clearAllMocks();
    mockRequest.cookies = {};
    mockResponse.cookie.mockClear();
    mockResponse.clearCookie.mockClear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDTO: RequestRegisterDTO = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      authClient.send.mockReturnValue(of(mockResponse));

      const result = await controller.register(registerDTO);

      expect(result).toEqual(mockResponse);
      expect(authClient.send).toHaveBeenCalledWith('createAuth', registerDTO);
      expect(logger.info).toHaveBeenCalledWith('User registration attempt', {
        context: 'AuthController',
        email: registerDTO.email,
        name: registerDTO.name,
        date: expect.any(String),
      });
    });

    it('should handle registration errors', async () => {
      const registerDTO: RequestRegisterDTO = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const error = new Error('Email already exists');
      authClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.register(registerDTO)).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should handle login errors', async () => {
      const loginDTO: RequestLoginDTO = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const error = new Error('Invalid credentials');
      authClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.login(loginDTO, mockRequest as any, mockResponse)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should handle refresh token errors', async () => {
      const refreshDTO: RequestRefreshTokenDTO = {
        refreshToken: 'invalid-refresh-token',
      };

      const error = new Error('Invalid refresh token');
      authClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.refreshToken(refreshDTO, mockRequest as any, mockResponse as any)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('profile', () => {
    it('should get user profile successfully', async () => {
      const userId = 'user123';
      const mockProfile = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar-url',
        createdAt: new Date(),
      };

      authClient.send.mockReturnValue(of(mockProfile));

      const result = await controller.profile(userId);

      expect(result).toEqual(mockProfile);
      expect(authClient.send).toHaveBeenCalledWith('profile', userId);
    });

    it('should handle profile not found', async () => {
      const userId = 'nonexistent';

      const error = new Error('User not found');
      authClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.profile(userId)).rejects.toThrow('User not found');
    });
  });

  describe('userInfo', () => {
    it('should get users with pagination', async () => {
      const queryDTO: RequestUsersQueryDTO = {
        page: 1,
        limit: 10,
        q: 'test',
      };

      const mockUsers = {
        data: [
          {
            id: 'user1',
            name: 'User 1',
            email: 'user1@example.com',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      authClient.send.mockReturnValue(of(mockUsers));

      const result = await controller.userInfo(queryDTO);

      expect(result).toEqual(mockUsers);
      expect(authClient.send).toHaveBeenCalledWith('users', queryDTO);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const userId = 'user123';
      const updatePasswordDTO: RequestUpdatePasswordDTO = {
        password: 'oldpassword',
        newPassword: 'newpassword',
      };

      authClient.send.mockReturnValue(of({ success: true }));

      const result = await controller.updatePassword(userId, updatePasswordDTO);

      expect(result).toEqual({ success: true });
      expect(authClient.send).toHaveBeenCalledWith('updatePassword', {
        userId,
        requestUpdatePasswordDTO: updatePasswordDTO,
      });
    });

    it('should handle password update errors', async () => {
      const userId = 'user123';
      const updatePasswordDTO: RequestUpdatePasswordDTO = {
        password: 'wrongpassword',
        newPassword: 'newpassword',
      };

      const error = new Error('Current password is incorrect');
      authClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.updatePassword(userId, updatePasswordDTO)).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('uploadAvatar', () => {
    it('should handle avatar upload errors', async () => {
      const userId = 'user123';
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'avatar.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('fake-image-data'),
      };

      await expect(controller.uploadAvatar(userId, mockFile as any)).rejects.toThrow('Invalid file format');
    });
  });
});
