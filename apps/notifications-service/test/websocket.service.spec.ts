import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@repo/types';
import { WebSocketService } from '../src/services/websocket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebSocketService],
    }).compile();

    service = module.get<WebSocketService>(WebSocketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addClient', () => {
    it('should add a client to the service', () => {
      const mockSocket = {
        id: 'client-1',
        send: jest.fn(),
      };

      service.addClient('user-1', mockSocket);

      expect(service.isUserConnected('user-1')).toBe(true);
    });
  });

  describe('removeClient', () => {
    it('should remove a client from the service', () => {
      const mockSocket = {
        id: 'client-1',
        emit: jest.fn(),
      };

      service.addClient('user-1', mockSocket);
      expect(service.isUserConnected('user-1')).toBe(true);

      service.removeClient('user-1');
      expect(service.isUserConnected('user-1')).toBe(false);
    });
  });

  describe('isUserConnected', () => {
    it('should return false when user is not connected', () => {
      expect(service.isUserConnected('user-1')).toBe(false);
    });

    it('should return true when user is connected', () => {
      const mockSocket = {
        id: 'client-1',
        emit: jest.fn(),
      };

      service.addClient('user-1', mockSocket);
      expect(service.isUserConnected('user-1')).toBe(true);
    });
  });

  describe('deliverNotification', () => {
    it('should deliver notification to connected user', () => {
      const mockSocket = {
        id: 'client-1',
        emit: jest.fn(),
      };

      service.addClient('user-1', mockSocket);

      const notification = {
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

      service.deliverNotification('user-1', notification);

      expect(mockSocket.emit).toHaveBeenCalledWith('task:created', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
    });

    it('should not deliver notification to disconnected user', () => {
      const notification = {
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

      expect(() =>
        service.deliverNotification('user-1', notification),
      ).not.toThrow();
    });
  });
});
