import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationEvent } from '@repo/types';
import { INotificationRepository } from '../repositories/notification.repository.interface';

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {
    this.logger.log(`[CONSUMER] NotificationConsumer initialized and ready to receive events`);
  }

  @EventPattern('test.connection')
  async handleTestConnection(@Payload() data: any) {
    this.logger.log(`[CONSUMER] Test connection received:`, data);
    return { success: true, message: 'Connection test successful' };
  }

  @EventPattern('notification.created')
  async handleNotificationCreated(@Payload() event: NotificationEvent) {
    this.logger.log(`[CONSUMER] EventPattern 'notification.created' triggered`);
    this.logger.log(`[CONSUMER] Received event -> id: ${event.id} | type: ${event.type} | userId: ${event.userId}`);

    try {
      this.logger.log(`[CONSUMER] Creating notification in database...`);
      const notification =
        await this.notificationRepository.createNotification(event);
      this.logger.log(`[CONSUMER] Notification created in database: ${notification.id}`);

      this.logger.log(`[CONSUMER] Sending notification to API Gateway WebSocket...`);
      try {
        const apiBase = process.env.API_GATEWAY_URL || 'http://localhost:3001';
        const url = `${apiBase}/api/internal/websocket/emit`;

        const payload = {
          userId: event.userId,
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            isRead: notification.isRead,
            createdAt: notification.createdAt,
          },
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`HTTP ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
        }
        this.logger.log(`[CONSUMER] Notification sent to API Gateway successfully`);
      } catch (httpError) {
        const message =
          httpError && typeof httpError === 'object' && 'message' in httpError
            ? (httpError as any).message
            : 'Unknown error';
        this.logger.error(
          `[CONSUMER] Failed to send notification to API Gateway: ${message}`,
        );
      }

      this.logger.log(`[CONSUMER] Successfully processed notification ${notification.id}`);
    } catch (error) {
      this.logger.error(
        `[CONSUMER] Failed to process notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
