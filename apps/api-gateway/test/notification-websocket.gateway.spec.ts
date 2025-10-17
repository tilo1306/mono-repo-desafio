import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { NotificationWebSocketGateway } from '../src/gateways/notification-websocket.gateway';
import { NotificationType } from '@repo/types';

describe('NotificationWebSocketGateway', () => {
  let gateway: NotificationWebSocketGateway;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(async () => {
    const mockJwtService = {
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    mockSocket = {
      id: 'socket123',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      handshake: {
        auth: {},
        query: {},
        headers: {},
      },
    } as any;

    mockServer = {
      sockets: {
        adapter: {
          rooms: new Map(),
        },
      },
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationWebSocketGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<NotificationWebSocketGateway>(NotificationWebSocketGateway);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    gateway.server = mockServer;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith('Client connected: socket123');
      loggerSpy.mockRestore();
    });

    it('should auto-join room with explicit userId in auth', () => {
      mockSocket.handshake.auth = { userId: 'user123' };
      const loggerSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('user-user123');
      expect(loggerSpy).toHaveBeenCalledWith('Auto-joined room user-user123 for socket socket123 (explicit userId)');
      loggerSpy.mockRestore();
    });

    it('should auto-join room with explicit userId in query', () => {
      mockSocket.handshake.query = { userId: 'user456' };
      const loggerSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('user-user456');
      expect(loggerSpy).toHaveBeenCalledWith('Auto-joined room user-user456 for socket socket123 (explicit userId)');
      loggerSpy.mockRestore();
    });

    it('should auto-join room with valid JWT token from auth', () => {
      mockSocket.handshake.auth = { token: 'valid-jwt-token' };
      configService.get.mockReturnValue('secret123');
      jwtService.verify.mockReturnValue({ sub: 'user789' });
      const loggerSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt-token', {
        secret: 'secret123',
      });
      expect(mockSocket.join).toHaveBeenCalledWith('user-user789');
      expect(loggerSpy).toHaveBeenCalledWith('Auto-joined room user-user789 for socket socket123 (token)');
      loggerSpy.mockRestore();
    });

    it('should auto-join room with valid JWT token from query', () => {
      mockSocket.handshake.query = { token: 'valid-jwt-token' };
      configService.get.mockReturnValue('secret123');
      jwtService.verify.mockReturnValue({ sub: 'user999' });
      const loggerSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt-token', {
        secret: 'secret123',
      });
      expect(mockSocket.join).toHaveBeenCalledWith('user-user999');
      expect(loggerSpy).toHaveBeenCalledWith('Auto-joined room user-user999 for socket socket123 (token)');
      loggerSpy.mockRestore();
    });

    it('should auto-join room with valid JWT token from Authorization header', () => {
      mockSocket.handshake.headers = { authorization: 'Bearer valid-jwt-token' };
      configService.get.mockReturnValue('secret123');
      jwtService.verify.mockReturnValue({ sub: 'user111' });
      const loggerSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt-token', {
        secret: 'secret123',
      });
      expect(mockSocket.join).toHaveBeenCalledWith('user-user111');
      expect(loggerSpy).toHaveBeenCalledWith('Auto-joined room user-user111 for socket socket123 (token)');
      loggerSpy.mockRestore();
    });

    it('should handle invalid JWT token gracefully', () => {
      mockSocket.handshake.auth = { token: 'invalid-jwt-token' };
      configService.get.mockReturnValue('secret123');
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      const loggerSpy = jest.spyOn(gateway['logger'], 'warn').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith('Failed to verify handshake token for socket socket123: Invalid token');
      loggerSpy.mockRestore();
    });

    it('should warn when no userId or token is provided', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'warn').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith('Socket socket123 connected without userId or token; awaiting \'authenticate\' message to join room');
      loggerSpy.mockRestore();
    });

    it('should handle errors during auto-auth', () => {
      mockSocket.handshake = null as any;
      const loggerSpy = jest.spyOn(gateway['logger'], 'error').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith('Error during auto-auth for socket socket123:', expect.any(Error));
      loggerSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();

      gateway.handleDisconnect(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith('Client disconnected: socket123');
      loggerSpy.mockRestore();
    });
  });

  describe('broadcastToUser', () => {
    it('should broadcast notification to user room', () => {
      const userId = 'user123';
      const notification = {
        id: 'notification123',
        type: NotificationType.COMMENT_CREATED,
        title: 'New Comment',
        message: 'A new comment was added',
        data: {},
        isRead: false,
        createdAt: new Date(),
      };

      gateway.broadcastToUser(userId, notification);

      expect(mockServer.to).toHaveBeenCalledWith(`user-${userId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('comment:new', notification);
    });

    it('should handle missing server gracefully', () => {
      gateway.server = undefined as any;
      const userId = 'user123';
      const notification = {
        id: 'notification123',
        type: NotificationType.TASK_CREATED,
        title: 'New Task',
        message: 'A new task was created',
        data: {},
        isRead: false,
        createdAt: new Date(),
      };

      expect(() => gateway.broadcastToUser(userId, notification)).not.toThrow();
    });

    it('should map different notification types to correct events', () => {
      const userId = 'user123';
      const notifications = [
        { type: NotificationType.TASK_CREATED, expectedEvent: 'task:created' },
        { type: NotificationType.TASK_UPDATED, expectedEvent: 'task:updated' },
        { type: NotificationType.COMMENT_CREATED, expectedEvent: 'comment:new' },
        { type: NotificationType.TASK_STATUS_CHANGED, expectedEvent: 'task:status' },
        { type: NotificationType.TASK_ASSIGNED, expectedEvent: 'task:assigned' },
        { type: 'UNKNOWN_TYPE' as any, expectedEvent: 'notification' },
      ];

      notifications.forEach(({ type, expectedEvent }) => {
        const notification = {
          id: 'notification123',
          type,
          title: 'Test',
          message: 'Test message',
          data: {},
          isRead: false,
          createdAt: new Date(),
        };

        gateway.broadcastToUser(userId, notification);

        expect(mockServer.to).toHaveBeenCalledWith(`user-${userId}`);
        expect(mockServer.emit).toHaveBeenCalledWith(expectedEvent, notification);
      });
    });
  });
});
