import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { HealthController } from '../src/modules/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let authClient: jest.Mocked<ClientProxy>;
  let tasksClient: jest.Mocked<ClientProxy>;
  let notificationClient: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    const mockAuthClient = {
      send: jest.fn(),
    };

    const mockTasksClient = {
      send: jest.fn(),
    };

    const mockNotificationClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: 'AUTH_SERVICE', useValue: mockAuthClient },
        { provide: 'TASKS_SERVICE', useValue: mockTasksClient },
        { provide: 'NOTIFICATION_SERVICE', useValue: mockNotificationClient },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    authClient = module.get('AUTH_SERVICE');
    tasksClient = module.get('TASKS_SERVICE');
    notificationClient = module.get('NOTIFICATION_SERVICE');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when all services are up', async () => {
      authClient.send.mockReturnValue(of({ status: 'up' }));
      tasksClient.send.mockReturnValue(of({ status: 'up' }));
      notificationClient.send.mockReturnValue(of({ status: 'up' }));

      const result = await controller.check();

      expect(result).toEqual({
        status: 'ok',
        info: {
          auth_service: 'up',
          tasks_service: 'up',
          notifications_service: 'up',
        },
        error: {},
        details: {
          auth_service: 'up',
          tasks_service: 'up',
          notifications_service: 'up',
        },
      });

      expect(authClient.send).toHaveBeenCalledWith('health', {});
      expect(tasksClient.send).toHaveBeenCalledWith('health', {});
      expect(notificationClient.send).toHaveBeenCalledWith('health', {});
    });

    it('should return error status when auth service is down', async () => {
      authClient.send.mockReturnValue(throwError(() => new Error('Connection failed')));
      tasksClient.send.mockReturnValue(of({ status: 'up' }));
      notificationClient.send.mockReturnValue(of({ status: 'up' }));

      const result = await controller.check();

      expect(result).toEqual({
        status: 'error',
        info: {
          auth_service: 'down',
          tasks_service: 'up',
          notifications_service: 'up',
        },
        error: {
          auth_service: 'Connection failed',
        },
        details: {
          auth_service: 'down',
          tasks_service: 'up',
          notifications_service: 'up',
        },
      });
    });

    it('should return error status when tasks service is down', async () => {
      authClient.send.mockReturnValue(of({ status: 'up' }));
      tasksClient.send.mockReturnValue(throwError(() => new Error('Service unavailable')));
      notificationClient.send.mockReturnValue(of({ status: 'up' }));

      const result = await controller.check();

      expect(result).toEqual({
        status: 'error',
        info: {
          auth_service: 'up',
          tasks_service: 'down',
          notifications_service: 'up',
        },
        error: {
          tasks_service: 'Service unavailable',
        },
        details: {
          auth_service: 'up',
          tasks_service: 'down',
          notifications_service: 'up',
        },
      });
    });

    it('should return error status when notifications service is down', async () => {
      authClient.send.mockReturnValue(of({ status: 'up' }));
      tasksClient.send.mockReturnValue(of({ status: 'up' }));
      notificationClient.send.mockReturnValue(throwError(() => new Error('Timeout')));

      const result = await controller.check();

      expect(result).toEqual({
        status: 'error',
        info: {
          auth_service: 'up',
          tasks_service: 'up',
          notifications_service: 'down',
        },
        error: {
          notifications_service: 'Timeout',
        },
        details: {
          auth_service: 'up',
          tasks_service: 'up',
          notifications_service: 'down',
        },
      });
    });

    it('should return error status when multiple services are down', async () => {
      authClient.send.mockReturnValue(throwError(() => new Error('Auth service down')));
      tasksClient.send.mockReturnValue(throwError(() => new Error('Tasks service down')));
      notificationClient.send.mockReturnValue(of({ status: 'up' }));

      const result = await controller.check();

      expect(result).toEqual({
        status: 'error',
        info: {
          auth_service: 'down',
          tasks_service: 'down',
          notifications_service: 'up',
        },
        error: {
          auth_service: 'Auth service down',
          tasks_service: 'Tasks service down',
        },
        details: {
          auth_service: 'down',
          tasks_service: 'down',
          notifications_service: 'up',
        },
      });
    });

    it('should handle non-Error exceptions', async () => {
      authClient.send.mockReturnValue(of({ status: 'up' }));
      tasksClient.send.mockReturnValue(of({ status: 'up' }));
      notificationClient.send.mockReturnValue(throwError(() => 'String error'));

      const result = await controller.check();

      expect(result).toEqual({
        status: 'error',
        info: {
          auth_service: 'up',
          tasks_service: 'up',
          notifications_service: 'down',
        },
        error: {
          notifications_service: 'Connection failed',
        },
        details: {
          auth_service: 'up',
          tasks_service: 'up',
          notifications_service: 'down',
        },
      });
    });
  });
});
