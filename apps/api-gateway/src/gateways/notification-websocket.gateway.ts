import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { NotificationType } from '@repo/types';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws/notifications',
  transports: ['websocket', 'polling'],
})
export class NotificationWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationWebSocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      const auth: any = client.handshake.auth || {};
      const query: any = client.handshake.query || {};
      const headers: any = client.handshake.headers || {};

      const headerAuth: string | undefined =
        headers['authorization'] || headers['Authorization'];
      const bearerToken =
        typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')
          ? headerAuth.substring(7)
          : undefined;

      const token: string | undefined =
        auth.token || query.token || bearerToken;
      const explicitUserId: string | undefined = auth.userId || query.userId;

      if (explicitUserId) {
        client.join(`user-${explicitUserId}`);
        this.logger.log(
          `Auto-joined room user-${explicitUserId} for socket ${client.id} (explicit userId)`,
        );
        return;
      }

      if (token) {
        try {
          const payload: any = this.jwtService.verify(token, {
            secret: this.configService.get<string>('JWT_SECRET', 'secret123'),
          });
          if (payload?.sub) {
            const userIdFromToken = String(payload.sub);
            client.join(`user-${userIdFromToken}`);
            this.logger.log(
              `Auto-joined room user-${userIdFromToken} for socket ${client.id} (token)`,
            );
            return;
          }
        } catch (e) {
          this.logger.warn(
            `Failed to verify handshake token for socket ${client.id}: ${e instanceof Error ? e.message : 'unknown error'}`,
          );
        }
      }

      this.logger.warn(
        `Socket ${client.id} connected without userId or token; awaiting 'authenticate' message to join room`,
      );
    } catch (error) {
      this.logger.error(
        `Error during auto-auth for socket ${client.id}:`,
        error as any,
      );
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.log(
        `Authentication attempt for socket ${client.id} with userId: ${data.userId}`,
      );

      const userId = data.userId;

      await client.join(`user-${userId}`);

      this.logger.log(`User ${userId} authenticated with socket ${client.id}`);

      client.emit('authenticated', { success: true, userId });
    } catch (error) {
      this.logger.error(
        `Authentication failed for socket ${client.id}:`,
        error,
      );
      client.emit('authentication_failed', { error: 'Invalid userId' });
    }
  }

  @SubscribeMessage('disconnect')
  handleDisconnectMessage(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    client.leave(`user-${userId}`);
    this.logger.log(`User ${userId} requested disconnect`);
  }

  async broadcastToUser(userId: string, notification: any) {
    this.logger.log(
      `Broadcasting notification to user ${userId}:`,
      notification,
    );
    const event = this.mapTypeToEvent(notification?.type);
    const roomName = `user-${userId}`;

    if (!this.server) {
      this.logger.warn(
        `WebSocket server not initialized yet. Skipping emit '${event}' to ${roomName}`,
      );
      return;
    }

    const adapter = this.server.sockets?.adapter as any;
    const room = adapter?.rooms?.get ? adapter.rooms.get(roomName) : undefined;
    const roomSize = room ? room.size : 0;
    this.logger.log(
      `Emitting '${event}' to room ${roomName} with ${roomSize} client(s)`,
    );
    this.server.to(roomName).emit(event, notification);
  }

  async broadcastToAll(notification: any) {
    this.logger.log(`Broadcasting notification to all users:`, notification);
    const event = this.mapTypeToEvent(notification?.type);
    if (!this.server) {
      this.logger.warn(
        `WebSocket server not initialized yet. Skipping broadcast '${event}' to all`,
      );
      return;
    }
    this.server.emit(event, notification);
  }

  private mapTypeToEvent(type?: NotificationType | string): string {
    switch (type) {
      case NotificationType.TASK_CREATED:
        return 'task:created';
      case NotificationType.TASK_UPDATED:
        return 'task:updated';
      case NotificationType.COMMENT_CREATED:
        return 'comment:new';
      case NotificationType.TASK_STATUS_CHANGED:
        return 'task:status';
      case NotificationType.TASK_ASSIGNED:
        return 'task:assigned';
      default:
        return 'notification';
    }
  }
}
