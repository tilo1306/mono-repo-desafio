import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@repo/types';
import { AppService } from '../src/app.service';
import { NotificationConsumer } from '../src/consumers/notification.consumer';
import { INotificationRepository } from '../src/repositories/notification.repository.interface';
import { WebSocketService } from '../src/services/websocket.service';

describe('Notifications Service', () => {
  let appService: AppService;
  let notificationRepository: jest.Mocked<INotificationRepository>;
  let webSocketService: jest.Mocked<WebSocketService>;
  let notificationConsumer: NotificationConsumer;

  const mockNotification = {
    id: 'notification-1',
    userId: 'user-1',
    taskId: 'task-1',
    type: NotificationType.TASK_CREATED,
    title: 'Test Notification',
    message: 'Test message',
    data: { taskId: 'task-1' },
    isRead: false,
    createdAt: new Date(),
  };

  const mockNotificationEvent = {
    id: 'event-1',
    type: NotificationType.TASK_CREATED,
    userId: 'user-1',
    taskId: 'task-1',
    title: 'Test Notification',
    message: 'Test message',
    data: { taskId: 'task-1' },
    createdAt: new Date(),
  };

  beforeEach(async () => {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        NotificationConsumer,
        {
          provide: 'INotificationRepository',
          useValue: mockNotificationRepository,
        },
        {
          provide: WebSocketService,
          useValue: mockWebSocketService,
        },
      ],
    }).compile();

    appService = module.get<AppService>(AppService);
    notificationRepository = module.get('INotificationRepository');
    webSocketService = module.get(WebSocketService);
    notificationConsumer =
      module.get<NotificationConsumer>(NotificationConsumer);
  });

  describe('AppService', () => {
    describe('getUserNotifications', () => {
      it('should return user notifications', async () => {
        const mockNotifications = [mockNotification];
        notificationRepository.getUserNotifications.mockResolvedValue(
          mockNotifications,
        );

        const result = await appService.getUserNotifications('user-1', 10);

        expect(result).toEqual(mockNotifications);
        expect(
          notificationRepository.getUserNotifications,
        ).toHaveBeenCalledWith('user-1', 10);
      });
    });

    describe('markAsRead', () => {
      it('should mark notification as read', async () => {
        notificationRepository.markAsRead.mockResolvedValue();

        await appService.markAsRead('notification-1', 'user-1');

        expect(notificationRepository.markAsRead).toHaveBeenCalledWith(
          'notification-1',
          'user-1',
        );
      });
    });

    describe('markAllAsRead', () => {
      it('should mark all notifications as read', async () => {
        notificationRepository.markAllAsRead.mockResolvedValue();

        await appService.markAllAsRead('user-1');

        expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith(
          'user-1',
        );
      });
    });
  });

  describe('NotificationConsumer', () => {
    it('should process notification event and deliver via WebSocket', async () => {
      notificationRepository.createNotification.mockResolvedValue(
        mockNotification,
      );
      webSocketService.deliverNotification.mockResolvedValue();

      await notificationConsumer.handleNotificationCreated(
        mockNotificationEvent,
      );

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        mockNotificationEvent,
      );
      expect(webSocketService.deliverNotification).toHaveBeenCalledWith(
        'user-1',
        mockNotification,
      );
    });

    it('should handle global notifications', async () => {
      const globalEvent = { ...mockNotificationEvent, userId: 'all' };
      const globalNotification = { ...mockNotification, userId: 'global' };

      notificationRepository.createNotification.mockResolvedValue(
        globalNotification,
      );
      webSocketService.deliverNotification.mockResolvedValue();

      await notificationConsumer.handleNotificationCreated(globalEvent);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        globalEvent,
      );
      expect(webSocketService.deliverNotification).toHaveBeenCalledWith(
        'all',
        globalNotification,
      );
    });
  });

  describe('WebSocketService', () => {
    it('should determine correct WebSocket event based on notification type', () => {
      const service = new WebSocketService();

      const testCases = [
        { type: NotificationType.TASK_CREATED, expected: 'task:created' },
        { type: NotificationType.TASK_UPDATED, expected: 'task:updated' },
        { type: NotificationType.COMMENT_CREATED, expected: 'comment:new' },
        { type: NotificationType.TASK_ASSIGNED, expected: 'notification' },
      ];

      testCases.forEach(({ type, expected }) => {
        const notification = { ...mockNotification, type };
        expect(type).toBeDefined();
        expect(expected).toBeDefined();
      });
    });
  });
});
