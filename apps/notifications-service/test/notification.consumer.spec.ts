import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@repo/types';
import { NotificationConsumer } from '../src/consumers/notification.consumer';
import { INotificationRepository } from '../src/repositories/notification.repository.interface';
import { WebSocketService } from '../src/services/websocket.service';

describe('NotificationConsumer', () => {
  let consumer: NotificationConsumer;
  let notificationRepository: jest.Mocked<INotificationRepository>;
  let webSocketService: jest.Mocked<WebSocketService>;

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

    consumer = module.get<NotificationConsumer>(NotificationConsumer);
    notificationRepository = module.get('INotificationRepository');
    webSocketService = module.get(WebSocketService);
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

      await consumer.handleNotificationCreated(event);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        event,
      );
      expect(webSocketService.deliverNotification).toHaveBeenCalledWith(
        'user-1',
        mockNotification,
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

      await consumer.handleNotificationCreated(event);

      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        event,
      );
      expect(webSocketService.deliverNotification).toHaveBeenCalledWith(
        'global',
        mockNotification,
      );
    });
  });
});
