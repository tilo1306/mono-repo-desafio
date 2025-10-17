import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@repo/types';
import { AppService } from '../src/app.service';
import { NotificationConsumer } from '../src/consumers/notification.consumer';
import { INotificationRepository } from '../src/repositories/notification.repository.interface';
global.fetch = jest.fn();

describe('Notifications Service', () => {
  let appService: AppService;
  let notificationRepository: jest.Mocked<INotificationRepository>;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        NotificationConsumer,
        {
          provide: 'INotificationRepository',
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    appService = module.get<AppService>(AppService);
    notificationRepository = module.get('INotificationRepository');
    notificationConsumer =
      module.get<NotificationConsumer>(NotificationConsumer);
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    it('should process notification event and send to API Gateway', async () => {
      notificationRepository.createNotification.mockResolvedValue(
        mockNotification,
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await notificationConsumer.handleNotificationCreated(
        mockNotificationEvent,
      );

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        mockNotificationEvent,
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/internal/websocket/emit',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'user-1',
            notification: {
              id: 'notification-1',
              type: NotificationType.TASK_CREATED,
              title: 'Test Notification',
              message: 'Test message',
              data: { taskId: 'task-1' },
              isRead: false,
              createdAt: mockNotification.createdAt,
            },
          }),
        }),
      );
    });

    it('should handle global notifications', async () => {
      const globalEvent = { ...mockNotificationEvent, userId: 'all' };
      const globalNotification = { ...mockNotification, userId: 'global' };

      notificationRepository.createNotification.mockResolvedValue(
        globalNotification,
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await notificationConsumer.handleNotificationCreated(globalEvent);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        globalEvent,
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/internal/websocket/emit',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'all',
            notification: {
              id: 'notification-1',
              type: NotificationType.TASK_CREATED,
              title: 'Test Notification',
              message: 'Test message',
              data: { taskId: 'task-1' },
              isRead: false,
              createdAt: globalNotification.createdAt,
            },
          }),
        }),
      );
    });
  });
});
