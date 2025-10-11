import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationEvent, NotificationType } from '@repo/types';

@Injectable()
export class NotificationPublisherService {
  private readonly logger = new Logger(NotificationPublisherService.name);

  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {}

  async publishTaskCreated(
    taskId: string,
    creatorId: string,
    taskTitle: string,
  ) {
    const notification: NotificationEvent = {
      id: `task-created-${taskId}-${Date.now()}`,
      type: NotificationType.TASK_CREATED,
      userId: 'all',
      taskId,
      title: 'Nova tarefa criada',
      message: `Uma nova tarefa foi criada: ${taskTitle}`,
      data: { taskId, taskTitle, creatorId },
      createdAt: new Date(),
    };

    await this.publishNotification(notification);
  }

  async publishTaskAssigned(
    taskId: string,
    assigneeId: string,
    taskTitle: string,
  ) {
    const notification: NotificationEvent = {
      id: `task-assigned-${taskId}-${assigneeId}-${Date.now()}`,
      type: NotificationType.TASK_ASSIGNED,
      userId: assigneeId,
      taskId,
      title: 'Nova tarefa atribuída',
      message: `Você foi atribuído à tarefa: ${taskTitle}`,
      data: { taskId, taskTitle },
      createdAt: new Date(),
    };

    await this.publishNotification(notification);
  }

  async publishTaskStatusChanged(
    taskId: string,
    userId: string,
    taskTitle: string,
    oldStatus: string,
    newStatus: string,
  ) {
    const notification: NotificationEvent = {
      id: `task-status-${taskId}-${userId}-${Date.now()}`,
      type: NotificationType.TASK_STATUS_CHANGED,
      userId,
      taskId,
      title: 'Status da tarefa alterado',
      message: `A tarefa "${taskTitle}" mudou de ${oldStatus} para ${newStatus}`,
      data: { taskId, taskTitle, oldStatus, newStatus },
      createdAt: new Date(),
    };

    await this.publishNotification(notification);
  }

  async publishTaskUpdated(taskId: string, userId: string, taskTitle: string) {
    const notification: NotificationEvent = {
      id: `task-updated-${taskId}-${Date.now()}`,
      type: NotificationType.TASK_UPDATED,
      userId: 'all',
      taskId,
      title: 'Tarefa atualizada',
      message: `A tarefa "${taskTitle}" foi atualizada`,
      data: { taskId, taskTitle, updatedBy: userId },
      createdAt: new Date(),
    };

    await this.publishNotification(notification);
  }

  async publishCommentCreated(
    taskId: string,
    userId: string,
    commentContent: string,
  ) {
    const notification: NotificationEvent = {
      id: `comment-created-${taskId}-${userId}-${Date.now()}`,
      type: NotificationType.COMMENT_CREATED,
      userId: 'all',
      taskId,
      title: 'Novo comentário',
      message: `Novo comentário adicionado: ${commentContent.substring(0, 100)}...`,
      data: { taskId, commentContent, commenterId: userId },
      createdAt: new Date(),
    };

    await this.publishNotification(notification);
  }

  private async publishNotification(notification: NotificationEvent) {
    try {
      await this.client.emit('notification.created', notification).toPromise();
      this.logger.log(
        `Published notification: ${notification.type} for user ${notification.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
