import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
});
