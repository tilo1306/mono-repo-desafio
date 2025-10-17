import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@repo/types';
import { NotificationConsumer } from '../src/consumers/notification.consumer';
import { INotificationRepository } from '../src/repositories/notification.repository.interface';
global.fetch = jest.fn();

describe('NotificationConsumer', () => {
  let consumer: NotificationConsumer;
  let notificationRepository: jest.Mocked<INotificationRepository>;

  beforeEach(async () => {
    const mockNotificationRepository = {
      createNotification: jest.fn(),
      getUserNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationConsumer,
        {
          provide: 'INotificationRepository',
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    consumer = module.get<NotificationConsumer>(NotificationConsumer);
    notificationRepository = module.get('INotificationRepository');
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('handleNotificationCreated', () => {
    it('should handle notification created event', async () => {
      const event = {
        id: 'event-1',
        type: NotificationType.TASK_CREATED,
        userId: 'user-1',
        taskId: 'task-1',
        title: 'Task Created',
        message: 'A new task has been created.',
        data: { taskId: 'task-1' },
        createdAt: new Date(),
      };

      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        taskId: 'task-1',
        type: NotificationType.TASK_CREATED,
        title: 'Task Created',
        message: 'A new task has been created.',
        data: { taskId: 'task-1' },
        isRead: false,
        createdAt: new Date(),
      };

      notificationRepository.createNotification.mockResolvedValue(
        mockNotification as any,
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await consumer.handleNotificationCreated(event);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        event,
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
              title: 'Task Created',
              message: 'A new task has been created.',
              data: { taskId: 'task-1' },
              isRead: false,
              createdAt: mockNotification.createdAt,
            },
          }),
        }),
      );
    });

    it('should handle global notification event', async () => {
      const event = {
        id: 'event-2',
        type: NotificationType.TASK_CREATED,
        userId: 'global',
        taskId: 'task-2',
        title: 'Global Task',
        message: 'A global task.',
        data: { taskId: 'task-2' },
        createdAt: new Date(),
      };

      const mockNotification = {
        id: 'notification-2',
        userId: 'global',
        taskId: 'task-2',
        type: NotificationType.TASK_CREATED,
        title: 'Global Task',
        message: 'A global task.',
        data: { taskId: 'task-2' },
        isRead: false,
        createdAt: new Date(),
      };

      notificationRepository.createNotification.mockResolvedValue(
        mockNotification as any,
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await consumer.handleNotificationCreated(event);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        event,
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/internal/websocket/emit',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'global',
            notification: {
              id: 'notification-2',
              type: NotificationType.TASK_CREATED,
              title: 'Global Task',
              message: 'A global task.',
              data: { taskId: 'task-2' },
              isRead: false,
              createdAt: mockNotification.createdAt,
            },
          }),
        }),
      );
    });

    it('should handle fetch error gracefully', async () => {
      const event = {
        id: 'event-3',
        type: NotificationType.TASK_CREATED,
        userId: 'user-3',
        taskId: 'task-3',
        title: 'Error Task',
        message: 'A task with error.',
        data: { taskId: 'task-3' },
        createdAt: new Date(),
      };

      const mockNotification = {
        id: 'notification-3',
        userId: 'user-3',
        taskId: 'task-3',
        type: NotificationType.TASK_CREATED,
        title: 'Error Task',
        message: 'A task with error.',
        data: { taskId: 'task-3' },
        isRead: false,
        createdAt: new Date(),
      };

      notificationRepository.createNotification.mockResolvedValue(
        mockNotification as any,
      );
      (global.fetch as jest.Mock).mockRejectedValue(new Error('fetch failed'));
      await expect(consumer.handleNotificationCreated(event)).resolves.not.toThrow();

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        event,
      );
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
