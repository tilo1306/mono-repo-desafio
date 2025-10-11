import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationEvent } from '@repo/types';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { WebSocketService } from '../services/websocket.service';

@Injectable()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
    private readonly webSocketService: WebSocketService,
  ) {}

  @EventPattern('notification.created')
  async handleNotificationCreated(@Payload() event: NotificationEvent) {
    try {
      this.logger.log(
        `Processing notification event: ${event.type} for user ${event.userId}`,
      );

      // Persistir todas as notificações no banco (incluindo globais)
      const notification =
        await this.notificationRepository.createNotification(event);

      // Entregar via WebSocket
      await this.webSocketService.deliverNotification(
        event.userId,
        notification,
      );

      this.logger.log(`Successfully processed notification ${notification.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
