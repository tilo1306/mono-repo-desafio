import { Body, Controller, Logger, Post } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { NotificationWebSocketGateway } from '../gateways/notification-websocket.gateway';

@Controller('internal/websocket')
export class InternalWebSocketController {
  private readonly logger = new Logger(InternalWebSocketController.name);

  constructor(
    private readonly notificationGateway: NotificationWebSocketGateway,
  ) {}

  @Post('emit')
  @Public()
  async emitNotification(
    @Body() data: { userId: string; notification: any },
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `[INTERNAL] Received notification for user ${data.userId} with type ${data?.notification?.type}`,
    );

    try {
      await this.notificationGateway.broadcastToUser(
        data.userId,
        data.notification,
      );
      this.logger.log(
        `[INTERNAL] Successfully broadcasted notification to user ${data.userId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `[INTERNAL] Failed to broadcast notification:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return { success: false };
    }
  }
}
