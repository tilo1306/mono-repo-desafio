import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEvent } from '@repo/types';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { INotificationRepository } from './notification.repository.interface';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  private readonly logger = new Logger(NotificationRepository.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(event: NotificationEvent): Promise<Notification> {
    const userId = event.userId === 'all' ? 'global' : event.userId;

    const notification = this.notificationRepository.create({
      userId,
      taskId: event.taskId,
      type: event.type,
      title: event.title,
      message: event.message,
      data: event.data,
      isRead: false,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);
    this.logger.log(
      `Created notification ${savedNotification.id} for user ${userId}`,
    );

    return savedNotification;
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );
    this.logger.log(`Marked notification ${notificationId} as read`);
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.logger.log(`Starting markAllAsRead for user ${userId}`);
    
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );

    this.logger.log(`Marked all notifications as read for user ${userId}`);
  }
}
