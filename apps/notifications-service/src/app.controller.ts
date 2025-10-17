import { Controller, Inject, Logger, Post, Body, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { INotificationRepository } from './repositories/notification.repository.interface';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}


  @MessagePattern('getUserNotifications')
  async getUserNotifications(
    @Payload() data: { userId: string; limit?: number },
  ) {
    return this.notificationRepository.getUserNotifications(
      data.userId,
      data.limit,
    );
  }

  @MessagePattern('markAsRead')
  async markAsRead(
    @Payload() data: { notificationId: string; userId: string },
  ) {
    await this.notificationRepository.markAsRead(
      data.notificationId,
      data.userId,
    );
    
    this.logger.log(`Notification ${data.notificationId} marked as read for user ${data.userId}`);
    
    await this.sendReadStatusUpdate(data.userId, data.notificationId, true);
    
    return { success: true };
  }

  @MessagePattern('markAllAsRead')
  async markAllAsRead(@Payload() data: { userId: string }) {
    this.logger.log(`[CONTROLLER] Received markAllAsRead request for user: ${data.userId}`);
    
    await this.notificationRepository.markAllAsRead(data.userId);
    
    this.logger.log(`[CONTROLLER] All notifications marked as read for user ${data.userId}`);
    
    await this.sendAllReadStatusUpdate(data.userId);
    
    return { success: true };
  }
  @Get('health')
  async healthHttp(): Promise<{ status: string }> {
    return { status: 'up' };
  }

  @MessagePattern('health')
  async health(): Promise<{ status: string }> {
    return { status: 'up' };
  }

  @Post('mark-all-read')
  async markAllAsReadHttp(@Body() data: { userId: string }) {
    this.logger.log(`[HTTP] Received markAllAsRead request for user: ${data.userId}`);
    
    await this.notificationRepository.markAllAsRead(data.userId);
    
    this.logger.log(`[HTTP] All notifications marked as read for user ${data.userId}`);
    
    await this.sendAllReadStatusUpdate(data.userId);
    
    return { success: true };
  }

  private async sendReadStatusUpdate(userId: string, notificationId: string, isRead: boolean) {
    try {
      const apiBase = process.env.API_GATEWAY_URL || 'http://localhost:3001';
      const url = `${apiBase}/api/internal/websocket/emit`;

      const payload = {
        userId,
        notification: {
          type: 'NOTIFICATION_READ_STATUS_UPDATE',
          notificationId,
          isRead,
          timestamp: new Date().toISOString(),
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
      
      this.logger.log(`Read status update sent to WebSocket for user ${userId}, notification ${notificationId}`);
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? (error as any).message
        : 'Unknown error';
      this.logger.error(`Failed to send read status update to WebSocket: ${message}`);
    }
  }

  private async sendAllReadStatusUpdate(userId: string) {
    try {
      const apiBase = process.env.API_GATEWAY_URL || 'http://localhost:3001';
      const url = `${apiBase}/api/internal/websocket/emit`;

      const payload = {
        userId,
        notification: {
          type: 'ALL_NOTIFICATIONS_READ_STATUS_UPDATE',
          isRead: true,
          timestamp: new Date().toISOString(),
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
      
      this.logger.log(`All read status update sent to WebSocket for user ${userId}`);
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error
        ? (error as any).message
        : 'Unknown error';
      this.logger.error(`Failed to send all read status update to WebSocket: ${message}`);
    }
  }
}
