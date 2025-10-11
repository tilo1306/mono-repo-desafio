import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { INotificationRepository } from './repositories/notification.repository.interface';

@Controller()
export class AppController {
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
    return { success: true };
  }

  @MessagePattern('markAllAsRead')
  async markAllAsRead(@Payload() data: { userId: string }) {
    await this.notificationRepository.markAllAsRead(data.userId);
    return { success: true };
  }
}
