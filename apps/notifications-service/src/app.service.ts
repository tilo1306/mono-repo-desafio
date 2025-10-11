import { Inject, Injectable, Logger } from '@nestjs/common';
import { Notification } from './entities/notification.entity';
import { INotificationRepository } from './repositories/notification.repository.interface';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async getUserNotifications(
    userId: string,
    limit: number = 50,
  ): Promise<Notification[]> {
    return this.notificationRepository.getUserNotifications(userId, limit);
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    return this.notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    return this.notificationRepository.markAllAsRead(userId);
  }
}
