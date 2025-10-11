import { NotificationEvent } from '@repo/types';
import { Notification } from '../entities/notification.entity';

export interface INotificationRepository {
  createNotification(event: NotificationEvent): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markAsRead(notificationId: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}
