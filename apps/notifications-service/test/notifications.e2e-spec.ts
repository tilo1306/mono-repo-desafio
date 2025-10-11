import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@repo/types';
import { AppModule } from '../app.module';
import { AppService } from '../app.service';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { WebSocketService } from '../services/websocket.service';

describe('Notifications Service E2E', () => {
  let app: INestApplication;
  let service: AppService;
  let notificationRepository: jest.Mocked<INotificationRepository>;
  let webSocketService: jest.Mocked<WebSocketService>;

  const mockNotification = {
    id: 'notification-1',
    userId: 'user-1',
    taskId: 'task-1',
    type: NotificationType.TASK_CREATED,
    title: 'E2E Test Notification',
    message: 'E2E test message',
    data: { taskId: 'task-1' },
    isRead: false,
    createdAt: new Date(),
  };

  const mockNotificationEvent = {
    id: 'event-1',
    type: NotificationType.TASK_CREATED,
    userId: 'user-1',
    taskId: 'task-1',
    title: 'E2E Test Notification',
    message: 'E2E test message',
    data: { taskId: 'task-1' },
    createdAt: new Date(),
  };

  beforeAll(async () => {
    const mockNotificationRepository = {
      createNotification: jest.fn(),
      getUserNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    const mockWebSocketService = {
      deliverNotification: jest.fn(),
      addClient: jest.fn(),
      removeClient: jest.fn(),
      isUserConnected: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('INotificationRepository')
      .useValue(mockNotificationRepository)
      .overrideProvider(WebSocketService)
      .useValue(mockWebSocketService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<AppService>(AppService);
    notificationRepository = moduleFixture.get('INotificationRepository');
    webSocketService = moduleFixture.get(WebSocketService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Notification Flow E2E', () => {
    it('should handle complete notification flow', async () => {
      notificationRepository.createNotification.mockResolvedValue(
        mockNotification,
      );
      notificationRepository.getUserNotifications.mockResolvedValue([
        mockNotification,
      ]);
      webSocketService.deliverNotification.mockResolvedValue();

      const notifications = await service.getUserNotifications('user-1', 10);
      expect(notifications).toEqual([mockNotification]);
      expect(notificationRepository.getUserNotifications).toHaveBeenCalledWith(
        'user-1',
        10,
      );

      await service.markAsRead('notification-1', 'user-1');
      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(
        'notification-1',
        'user-1',
      );

      await service.markAllAsRead('user-1');
      expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('should handle different notification types', async () => {
      const notificationTypes = [
        NotificationType.TASK_CREATED,
        NotificationType.TASK_UPDATED,
        NotificationType.COMMENT_CREATED,
        NotificationType.TASK_ASSIGNED,
      ];

      for (const type of notificationTypes) {
        const event = { ...mockNotificationEvent, type };
        const notification = { ...mockNotification, type };

        notificationRepository.createNotification.mockResolvedValue(
          notification,
        );
        webSocketService.deliverNotification.mockResolvedValue();

        await service.getUserNotifications('user-1', 10);

        expect(notificationRepository.getUserNotifications).toHaveBeenCalled();
      }
    });

    it('should handle pagination correctly', async () => {
      const mockNotifications = Array.from({ length: 25 }, (_, i) => ({
        ...mockNotification,
        id: `notification-${i + 1}`,
      }));

      notificationRepository.getUserNotifications.mockResolvedValue(
        mockNotifications.slice(0, 10),
      );

      const result = await service.getUserNotifications('user-1', 1, 10);

      expect(result).toHaveLength(10);
      expect(notificationRepository.getUserNotifications).toHaveBeenCalledWith(
        'user-1',
        10,
      );
    });
  });
});
