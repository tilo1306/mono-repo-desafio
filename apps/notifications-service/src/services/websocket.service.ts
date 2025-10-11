import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@repo/types';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private connectedClients = new Map<string, any>(); // userId -> socket connection

  async deliverNotification(userId: string, notification: Notification) {
    try {
      // Determinar o evento WebSocket baseado no tipo de notificação
      const websocketEvent = this.getWebSocketEvent(notification.type);

      if (userId === 'global') {
        this.deliverToAllClients(notification, websocketEvent);
        return;
      }

      const client = this.connectedClients.get(userId);

      if (client) {
        client.emit(websocketEvent, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });

        this.logger.log(
          `Delivered ${websocketEvent} notification ${notification.id} to user ${userId} via WebSocket`,
        );
      } else {
        this.logger.log(
          `User ${userId} not connected via WebSocket, notification stored for later delivery`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to deliver notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private getWebSocketEvent(notificationType: NotificationType): string {
    switch (notificationType) {
      case NotificationType.TASK_CREATED:
        return 'task:created';
      case NotificationType.TASK_UPDATED:
        return 'task:updated';
      case NotificationType.COMMENT_CREATED:
        return 'comment:new';
      default:
        return 'notification';
    }
  }

  private deliverToAllClients(
    notification: Notification,
    websocketEvent: string,
  ) {
    const connectedUsers = Array.from(this.connectedClients.keys());

    this.connectedClients.forEach((client, userId) => {
      try {
        client.emit(websocketEvent, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });
      } catch (error) {
        this.logger.error(`Failed to deliver to user ${userId}: ${error}`);
      }
    });

    this.logger.log(
      `Delivered ${websocketEvent} notification ${notification.id} to ${connectedUsers.length} connected users`,
    );
  }

  addClient(userId: string, socket: any) {
    this.connectedClients.set(userId, socket);
    this.logger.log(`User ${userId} connected to WebSocket`);
  }

  removeClient(userId: string) {
    this.connectedClients.delete(userId);
    this.logger.log(`User ${userId} disconnected from WebSocket`);
  }

  isUserConnected(userId: string): boolean {
    return this.connectedClients.has(userId);
  }
}
