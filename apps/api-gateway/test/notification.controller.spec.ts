import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { NotificationController } from '../src/modules/notification/notification.controller';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationClient: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    const mockNotificationClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: 'NOTIFICATION_SERVICE', useValue: mockNotificationClient },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationClient = module.get('NOTIFICATION_SERVICE');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with limit', async () => {
      const userId = 'user123';
      const limit = 20;

      const mockNotifications = [
        {
          id: 'notification1',
          type: 'COMMENT_CREATED',
          title: 'Novo comentário - Test Task',
          message: 'Na tarefa "Test Task": Este é um comentário de teste...',
          isRead: false,
          createdAt: new Date(),
          taskId: 'task123',
          data: {
            taskId: 'task123',
            commentContent: 'Este é um comentário de teste',
            commenterId: 'user456',
            taskTitle: 'Test Task',
          },
        },
        {
          id: 'notification2',
          type: 'TASK_CREATED',
          title: 'Tarefa criada com sucesso',
          message: 'Sua tarefa "New Task" foi criada com sucesso!',
          isRead: true,
          createdAt: new Date(),
          taskId: 'task456',
          data: {
            taskId: 'task456',
            taskTitle: 'New Task',
            creatorId: 'user123',
          },
        },
      ];

      notificationClient.send.mockReturnValue(of(mockNotifications));

      const result = await controller.getUserNotifications(userId, limit);

      expect(result).toEqual(mockNotifications);
      expect(notificationClient.send).toHaveBeenCalledWith('getUserNotifications', {
        userId,
        limit,
      });
    });

    it('should get user notifications without limit', async () => {
      const userId = 'user123';

      const mockNotifications = [
        {
          id: 'notification1',
          type: 'COMMENT_CREATED',
          title: 'Novo comentário - Test Task',
          message: 'Na tarefa "Test Task": Este é um comentário de teste...',
          isRead: false,
          createdAt: new Date(),
          taskId: 'task123',
          data: {},
        },
      ];

      notificationClient.send.mockReturnValue(of(mockNotifications));

      const result = await controller.getUserNotifications(userId);

      expect(result).toEqual(mockNotifications);
      expect(notificationClient.send).toHaveBeenCalledWith('getUserNotifications', {
        userId,
        limit: undefined,
      });
    });

    it('should handle errors when getting notifications', async () => {
      const userId = 'user123';
      const limit = 20;

      const error = new Error('Failed to get notifications');
      notificationClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.getUserNotifications(userId, limit)).rejects.toThrow('Failed to get notifications');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const notificationId = 'notification123';
      const userId = 'user123';

      notificationClient.send.mockReturnValue(of(undefined));

      const result = await controller.markAsRead(notificationId, userId);

      expect(result).toEqual({ success: true });
      expect(notificationClient.send).toHaveBeenCalledWith('markAsRead', {
        notificationId,
        userId,
      });
    });

    it('should handle errors when marking notification as read', async () => {
      const notificationId = 'notification123';
      const userId = 'user123';

      const error = new Error('Notification not found');
      notificationClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.markAsRead(notificationId, userId)).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      const userId = 'user123';

      notificationClient.send.mockReturnValue(of(undefined));

      const result = await controller.markAllAsRead(userId);

      expect(result).toEqual({ success: true });
      expect(notificationClient.send).toHaveBeenCalledWith('markAllAsRead', {
        userId,
      });
    });

    it('should handle errors when marking all notifications as read', async () => {
      const userId = 'user123';

      const error = new Error('Failed to mark all notifications as read');
      notificationClient.send.mockReturnValue(throwError(() => error));

      await expect(controller.markAllAsRead(userId)).rejects.toThrow('Failed to mark all notifications as read');
    });
  });
});
