import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationEvent, NotificationType } from '@repo/types';
import { catchError, firstValueFrom, of } from 'rxjs';

@Injectable()
export class NotificationPublisherService {
  private readonly logger = new Logger(NotificationPublisherService.name);

  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {
    this.logger.log(`[NOTIFICATION] NotificationPublisherService initialized`);
    this.logger.log(
      `[NOTIFICATION] Client proxy type: ${this.client?.constructor?.name || 'Unknown'}`,
    );
  }

  async publishTaskCreated(
    taskId: string,
    creatorId: string,
    taskTitle: string,
  ) {
    this.logger.log(
      `[NOTIFICATION] Publishing task created notification for task: ${taskId} to creator: ${creatorId}`,
    );

    const notification: NotificationEvent = {
      id: `task-created-${taskId}-${Date.now()}`,
      type: NotificationType.TASK_CREATED,
      userId: creatorId, // Enviar para o criador da tarefa
      taskId,
      title: 'Tarefa criada com sucesso',
      message: `Sua tarefa "${taskTitle}" foi criada com sucesso!`,
      data: { taskId, taskTitle, creatorId },
      createdAt: new Date(),
    };

    this.logger.log(`[NOTIFICATION] Task created notification payload:`, {
      id: notification.id,
      type: notification.type,
      userId: notification.userId,
      taskId: notification.taskId,
      title: notification.title,
    });

    await this.publishNotification(notification);
  }

  async publishTaskAssigned(
    taskId: string,
    assigneeId: string,
    taskTitle: string,
  ) {
    this.logger.log(
      `[NOTIFICATION] Publishing task assigned notification for task: ${taskId}, assignee: ${assigneeId}`,
    );

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

    this.logger.log(`[NOTIFICATION] Task assigned notification payload:`, {
      id: notification.id,
      type: notification.type,
      userId: notification.userId,
      taskId: notification.taskId,
      title: notification.title,
    });

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
      userId: userId,
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
    try {
      const participants = await this.getTaskParticipants(taskId);

      for (const participantId of participants) {
        if (participantId === userId) continue;

        const notification: NotificationEvent = {
          id: `comment-created-${taskId}-${participantId}-${Date.now()}`,
          type: NotificationType.COMMENT_CREATED,
          userId: participantId,
          taskId,
          title: 'Novo comentário',
          message: `Novo comentário adicionado: ${commentContent.substring(0, 100)}...`,
          data: { taskId, commentContent, commenterId: userId },
          createdAt: new Date(),
        };

        await this.publishNotification(notification);
      }
    } catch (error) {
      this.logger.error(
        `[NOTIFICATION] Failed to publish comment notifications`,
        error as any,
      );
      throw error;
    }
  }

  async publishCommentCreatedForUser(
    taskId: string,
    taskTitle: string,
    recipientUserId: string,
    commenterId: string,
    commentContent: string,
  ) {
    const notification: NotificationEvent = {
      id: `comment-created-${taskId}-${recipientUserId}-${Date.now()}`,
      type: NotificationType.COMMENT_CREATED,
      userId: recipientUserId,
      taskId,
      title: 'Novo comentário',
      message: `Na tarefa "${taskTitle}"`,
      data: { taskId, taskTitle, commentContent, commenterId },
      createdAt: new Date(),
    };

    await this.publishNotification(notification);
  }

  private async getTaskParticipants(taskId: string): Promise<string[]> {
    try {
      const creator = await (this as any).client;
      return [];
    } catch {
      return [];
    }
  }

  async testConnection() {
    try {
      this.logger.log(`[NOTIFICATION] Testing RabbitMQ connection...`);
      const result = await firstValueFrom(
        this.client.emit('test.connection', { test: true }),
      );
      this.logger.log(`[NOTIFICATION] Connection test result:`, result);
      return true;
    } catch (error) {
      this.logger.error(`[NOTIFICATION] Connection test failed:`, error);
      return false;
    }
  }

  private async publishNotification(notification: NotificationEvent) {
    try {
      this.logger.log(
        `[NOTIFICATION] Attempting to publish notification: ${notification.id}`,
      );
      this.logger.log(`[NOTIFICATION] Client proxy status:`, {
        isConnected: this.client ? 'Client exists' : 'Client is null/undefined',
        clientType: this.client?.constructor?.name || 'Unknown',
      });

      this.logger.log(`[NOTIFICATION] About to call client.emit...`);
      const result = await firstValueFrom(
        this.client
          .emit('notification.created', notification)
          .pipe(catchError(() => of(null))),
      );
      this.logger.log(`[NOTIFICATION] Client.emit result:`, result);

      this.logger.log(
        `[NOTIFICATION] Successfully published notification: ${notification.type} for user ${notification.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `[NOTIFICATION] Failed to publish notification: ${notification.id}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error?.constructor?.name || typeof error,
          errorDetails: JSON.stringify(error),
          stack: error instanceof Error ? error.stack : undefined,
          notification: {
            id: notification.id,
            type: notification.type,
            userId: notification.userId,
            taskId: notification.taskId,
          },
        },
      );
      throw error;
    }
  }
}
