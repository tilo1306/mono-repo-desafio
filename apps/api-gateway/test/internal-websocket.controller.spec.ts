import { Test, TestingModule } from '@nestjs/testing';
import { InternalWebSocketController } from '../src/controllers/internal-websocket.controller';
import { NotificationWebSocketGateway } from '../src/gateways/notification-websocket.gateway';

describe('InternalWebSocketController', () => {
  let controller: InternalWebSocketController;
  let notificationGateway: jest.Mocked<NotificationWebSocketGateway>;

  beforeEach(async () => {
    const mockNotificationGateway = {
      broadcastToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalWebSocketController],
      providers: [
        { provide: NotificationWebSocketGateway, useValue: mockNotificationGateway },
      ],
    }).compile();

    controller = module.get<InternalWebSocketController>(InternalWebSocketController);
    notificationGateway = module.get(NotificationWebSocketGateway);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('emitNotification', () => {
    it('should emit notification successfully', async () => {
      const data = {
        userId: 'user123',
        notification: {
          id: 'notification123',
          type: 'COMMENT_CREATED',
          title: 'New Comment',
          message: 'A new comment was added',
          data: {},
          isRead: false,
          createdAt: new Date(),
        },
      };

      notificationGateway.broadcastToUser.mockResolvedValue(undefined);

      const result = await controller.emitNotification(data);

      expect(result).toEqual({ success: true });
      expect(notificationGateway.broadcastToUser).toHaveBeenCalledWith(
        data.userId,
        data.notification,
      );
    });

    it('should handle broadcast errors gracefully', async () => {
      const data = {
        userId: 'user123',
        notification: {
          id: 'notification123',
          type: 'COMMENT_CREATED',
          title: 'New Comment',
          message: 'A new comment was added',
          data: {},
          isRead: false,
          createdAt: new Date(),
        },
      };

      const error = new Error('Broadcast failed');
      notificationGateway.broadcastToUser.mockRejectedValue(error);

      const result = await controller.emitNotification(data);

      expect(result).toEqual({ success: false });
      expect(notificationGateway.broadcastToUser).toHaveBeenCalledWith(
        data.userId,
        data.notification,
      );
    });

    it('should handle non-Error exceptions', async () => {
      const data = {
        userId: 'user123',
        notification: {
          id: 'notification123',
          type: 'COMMENT_CREATED',
          title: 'New Comment',
          message: 'A new comment was added',
          data: {},
          isRead: false,
          createdAt: new Date(),
        },
      };

      notificationGateway.broadcastToUser.mockRejectedValue('String error');

      const result = await controller.emitNotification(data);

      expect(result).toEqual({ success: false });
      expect(notificationGateway.broadcastToUser).toHaveBeenCalledWith(
        data.userId,
        data.notification,
      );
    });

    it('should log notification receipt and success', async () => {
      const data = {
        userId: 'user123',
        notification: {
          id: 'notification123',
          type: 'TASK_CREATED',
          title: 'New Task',
          message: 'A new task was created',
          data: {},
          isRead: false,
          createdAt: new Date(),
        },
      };

      notificationGateway.broadcastToUser.mockResolvedValue(undefined);
      const loggerSpy = jest.spyOn(controller['logger'], 'log').mockImplementation();

      await controller.emitNotification(data);

      expect(loggerSpy).toHaveBeenCalledWith(
        '[INTERNAL] Received notification for user user123 with type TASK_CREATED',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        '[INTERNAL] Successfully broadcasted notification to user user123',
      );

      loggerSpy.mockRestore();
    });

    it('should log errors when broadcast fails', async () => {
      const data = {
        userId: 'user123',
        notification: {
          id: 'notification123',
          type: 'COMMENT_CREATED',
          title: 'New Comment',
          message: 'A new comment was added',
          data: {},
          isRead: false,
          createdAt: new Date(),
        },
      };

      const error = new Error('Broadcast failed');
      notificationGateway.broadcastToUser.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(controller['logger'], 'error').mockImplementation();

      await controller.emitNotification(data);

      expect(loggerSpy).toHaveBeenCalledWith(
        '[INTERNAL] Failed to broadcast notification:',
        'Broadcast failed',
      );

      loggerSpy.mockRestore();
    });
  });
});
