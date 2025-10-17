import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

const mockRegisterUserDTO = {
  name: 'João Silva',
  email: 'joao@example.com',
  password: 'plainPassword123',
};

describe('AppController', () => {
  let controller: AppController;
  let service: jest.Mocked<AppService>;

  beforeEach(async () => {
    const mockAppService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      profile: jest.fn(),
      avatar: jest.fn(),
      users: jest.fn(),
      updatePassword: jest.fn().mockResolvedValue({ success: true, message: 'Password updated successfully' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call appService.register with correct parameters', async () => {
      const mockResponse = { message: 'User created successfully.' };
      service.register.mockResolvedValue(mockResponse);

      const result = await controller.register(mockRegisterUserDTO);

      expect(service.register).toHaveBeenCalledWith(mockRegisterUserDTO);
      expect(service.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from appService', async () => {
      const error = new Error('Service error');
      service.register.mockRejectedValue(error);

      await expect(controller.register(mockRegisterUserDTO)).rejects.toThrow(
        error,
      );
      expect(service.register).toHaveBeenCalledWith(mockRegisterUserDTO);
    });
  });

  describe('profile', () => {
    it('should call appService.profile with correct parameters', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResponse = {
        name: 'João Silva',
        email: 'joao@example.com',
        avatar: 'https://example.com/avatar.jpg',
      };
      service.profile.mockResolvedValue(mockResponse);

      const result = await controller.profile(userId);

      expect(service.profile).toHaveBeenCalledWith(userId);
      expect(service.profile).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('uploadAvatar', () => {
    it('should call appService.avatar with correct parameters', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        originalname: 'avatar.jpg',
        buffer: Buffer.from('fake-image-data'),
      };
      const mockData = { userId, file: mockFile };
      const mockResponse = { avatarUrl: '/api/auth/avatar/123/1640995200000-123.jpg' };
      service.avatar.mockResolvedValue(mockResponse);

      const result = await controller.uploadAvatar(mockData);

      expect(service.avatar).toHaveBeenCalledWith(userId, mockFile);
      expect(service.avatar).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('users', () => {
    it('should call appService.users with correct parameters', async () => {
      const mockRequestUsersDTO = {
        page: 1,
        limit: 10,
        email: 'test@example.com',
      };

      const mockResponse = {
        data: [
          {
            name: 'João Silva',
            email: 'joao@example.com',
            avatar: 'https://robohash.org/joao@example.com',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      service.users.mockResolvedValue(mockResponse);

      const result = await controller.users(mockRequestUsersDTO);

      expect(service.users).toHaveBeenCalledWith(mockRequestUsersDTO);
      expect(service.users).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors from appService', async () => {
      const mockRequestUsersDTO = {
        page: 1,
        limit: 10,
      };

      const error = new Error('Service error');
      service.users.mockRejectedValue(error);

      await expect(controller.users(mockRequestUsersDTO)).rejects.toThrow(error);
      expect(service.users).toHaveBeenCalledWith(mockRequestUsersDTO);
    });
  });

  describe('updatePassword', () => {
    it('should call appService.updatePassword with correct parameters', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUpdatePasswordDTO = {
        password: 'currentPassword123',
        newPassword: 'newPassword123',
      };
      const mockData = { userId, requestUpdatePasswordDTO: mockUpdatePasswordDTO };
      
      const result = await controller.updatePassword(mockData);

      expect(service.updatePassword).toHaveBeenCalledWith(userId, mockUpdatePasswordDTO);
      expect(service.updatePassword).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true, message: 'Password updated successfully' });
    });

    it('should propagate errors from appService', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUpdatePasswordDTO = {
        password: 'currentPassword123',
        newPassword: 'newPassword123',
      };
      const mockData = { userId, requestUpdatePasswordDTO: mockUpdatePasswordDTO };

      const error = new Error('Service error');
      service.updatePassword.mockRejectedValue(error);

      await expect(controller.updatePassword(mockData)).rejects.toThrow(error);
      expect(service.updatePassword).toHaveBeenCalledWith(userId, mockUpdatePasswordDTO);
    });
  });
});
