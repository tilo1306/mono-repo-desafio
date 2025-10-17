import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectDataSource } from '@nestjs/typeorm';
import { RpcErrorHelper } from '@repo/utils';
import { DataSource } from 'typeorm';
import { CreateTaskDto } from './dtos/create-task.dto';
import { Comment } from './entities/comment.entity';
import { Task } from './entities/task.entity';
import { IAssigneeRepository } from './repositories/assignee/assignee.repository.interface';
import { ICommentRepository } from './repositories/comment/comment.repository.interface';
import { ITaskRepository } from './repositories/task/task.repository.interface';
import { IUserRepository } from './repositories/user/user.repository.interface';
import { NotificationPublisherService } from './services/notification-publisher.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @Inject('ITaskRepository')
    private readonly taskRepository: ITaskRepository,
    @Inject('IAssigneeRepository')
    private readonly assigneeRepository: IAssigneeRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ICommentRepository')
    private readonly commentRepository: ICommentRepository,
    private readonly notificationPublisher: NotificationPublisherService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    try {
      this.logger.log(
        `[CREATE_TASK] Creating task: ${createTaskDto.title} for user: ${createTaskDto.userId}`,
      );

      const isUserExists = await this.userRepository.findById(
        createTaskDto.userId,
      );
      if (!isUserExists) {
        this.logger.warn(
          `[CREATE_TASK] User not found: ${createTaskDto.userId}`,
        );
        throw new RpcException(
          RpcErrorHelper.NotFoundException('User not found'),
        );
      }

      const assigneeEmails = createTaskDto.assigneeEmails.map(email => email);
      this.logger.log(
        `[CREATE_TASK] Validating ${assigneeEmails.length} assignees: ${assigneeEmails.join(', ')}`,
      );

      const isAssigneeExists =
        await this.userRepository.findManyByEmails(assigneeEmails);
      if (isAssigneeExists.length !== assigneeEmails.length) {
        this.logger.warn(
          `[CREATE_TASK] Invalid assignee emails. Expected: ${assigneeEmails.length}, Found: ${isAssigneeExists.length}`,
        );
        throw new RpcException(
          RpcErrorHelper.BadRequestException('Assignee emails are not valid'),
        );
      }

      const task = await this.taskRepository.create(createTaskDto);
      this.logger.log(`[CREATE_TASK] Task created successfully: ${task.id}`);

      try {
        await this.notificationPublisher.publishTaskCreated(
          task.id,
          createTaskDto.userId,
          task.title,
        );
        this.logger.log(
          `[CREATE_TASK] Task created notification sent to creator: ${isUserExists.email}`,
        );
      } catch (notificationError) {
        this.logger.error(
          `[CREATE_TASK] Error publishing task created notification:`,
          notificationError,
        );
        throw notificationError;
      }

      this.logger.log(
        `[CREATE_TASK] Step 5: Creating assignees and sending notifications`,
      );

      for (const assignee of isAssigneeExists) {
        try {
          await this.assigneeRepository.create({
            taskId: task.id,
            userId: assignee.id,
          });

          if (assignee.id !== createTaskDto.userId) {
            this.logger.log(
              `[CREATE_TASK] Publishing task assigned notification for assignee: ${assignee.email}`,
            );
            await this.notificationPublisher.publishTaskAssigned(
              task.id,
              assignee.id,
              task.title,
            );
          } else {
            this.logger.log(
              `[CREATE_TASK] Skipping task assigned notification for creator: ${assignee.email}`,
            );
          }
        } catch (assigneeError) {
          this.logger.error(
            `[CREATE_TASK] Error processing assignee ${assignee.email}:`,
            assigneeError,
          );
          throw assigneeError;
        }
      }

      this.logger.log(
        `[CREATE_TASK] Task creation completed successfully: ${task.id}`,
      );
      return task;
    } catch (error) {
      this.logger.error(`[CREATE_TASK] Task creation failed:`, error);
      throw error;
    }
  }

  async getTasks(
    userId: string,
    page: number = 1,
    size: number = 10,
    filters?: { q?: string; status?: string; priority?: string },
  ) {
    this.logger.log(
      `[GET_TASKS] Getting all tasks, page ${page}, size ${size}`,
    );

    const result = await this.taskRepository.findByUserIdWithPagination(
      userId,
      page,
      size,
      filters,
    );

    this.logger.log(`[GET_TASKS] Found ${result.total} tasks`);
    return result;
  }

  async getAllTasks(
    page: number = 1,
    size: number = 10,
    filters?: { q?: string; status?: string; priority?: string },
  ) {
    this.logger.log(
      `[GET_ALL_TASKS] Getting all tasks, page ${page}, size ${size}`,
    );

    const result = await this.taskRepository.findAllWithPagination(
      page,
      size,
      filters,
    );

    this.logger.log(`[GET_ALL_TASKS] Found ${result.total} tasks`);
    return result;
  }

  async getTask(taskId: string, userId: string): Promise<Task> {
    this.logger.log(`[GET_TASK] Getting task ${taskId} for user ${userId}`);

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      this.logger.warn(`[GET_TASK] Task not found: ${taskId}`);
      throw new RpcException(
        RpcErrorHelper.NotFoundException('Task not found'),
      );
    }

    this.logger.log(`[GET_TASK] Task retrieved successfully: ${taskId}`);
    return task;
  }

  async updateTask(
    taskId: string,
    userId: string,
    updates: any,
  ): Promise<Task> {
    this.logger.log(`[UPDATE_TASK] Updating task ${taskId} for user ${userId}`);

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      this.logger.warn(`[UPDATE_TASK] Task not found: ${taskId}`);
      throw new RpcException(
        RpcErrorHelper.NotFoundException('Task not found'),
      );
    }

    return await this.dataSource.transaction(async manager => {
      const validTaskFields = [
        'title',
        'description',
        'deadline',
        'priority',
        'status',
      ];
      const taskUpdates = Object.keys(updates)
        .filter(key => validTaskFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      await manager.update('tasks', { id: taskId }, taskUpdates);

      if (updates.assigneeEmails && Array.isArray(updates.assigneeEmails)) {
        this.logger.log(`[UPDATE_TASK] Managing assignees for task ${taskId}`);

        const newAssigneeEmails = updates.assigneeEmails;
        this.logger.log(
          `[UPDATE_TASK] New assignee emails: ${newAssigneeEmails.join(', ')}`,
        );

        const newAssigneeUsers =
          await this.userRepository.findManyByEmails(newAssigneeEmails);
        if (newAssigneeUsers.length !== newAssigneeEmails.length) {
          this.logger.warn(
            `[UPDATE_TASK] Invalid assignee emails. Expected: ${newAssigneeEmails.length}, Found: ${newAssigneeUsers.length}`,
          );
          throw new RpcException(
            RpcErrorHelper.BadRequestException('Assignee emails are not valid'),
          );
        }

        const currentAssignees =
          await this.taskRepository.getTaskAssigneesWithEmails(taskId);

        const currentEmails = currentAssignees.map(a => a.email);
        this.logger.log(
          `[UPDATE_TASK] Current assignee emails: ${currentEmails.join(', ')}`,
        );

        const emailsToRemove = currentEmails.filter(
          email => !newAssigneeEmails.includes(email),
        );
        this.logger.log(
          `[UPDATE_TASK] Emails to remove: ${emailsToRemove.join(', ')}`,
        );

        for (const emailToRemove of emailsToRemove) {
          const assigneeToRemove = currentAssignees.find(
            a => a.email === emailToRemove,
          );
          if (assigneeToRemove) {
            await manager.delete('assignees', {
              taskId: taskId,
              userId: assigneeToRemove.userId,
            });
            this.logger.log(`[UPDATE_TASK] Removed assignee: ${emailToRemove}`);
          }
        }

        const emailsToAdd = newAssigneeEmails.filter(
          email => !currentEmails.includes(email),
        );
        this.logger.log(
          `[UPDATE_TASK] Emails to add: ${emailsToAdd.join(', ')}`,
        );

        for (const emailToAdd of emailsToAdd) {
          const userToAdd = newAssigneeUsers.find(u => u.email === emailToAdd);
          if (userToAdd) {
            await manager.insert('assignees', {
              taskId: taskId,
              userId: userToAdd.id,
            });
            this.logger.log(`[UPDATE_TASK] Added assignee: ${emailToAdd}`);
          }
        }
      }

      const updatedTask = await this.taskRepository.findById(taskId);
      if (!updatedTask) {
        this.logger.warn(`[UPDATE_TASK] Failed to update task: ${taskId}`);
        throw new RpcException(
          RpcErrorHelper.NotFoundException('Task not found'),
        );
      }

      this.logger.log(`[UPDATE_TASK] Task updated successfully: ${taskId}`);

      await this.notificationPublisher.publishTaskUpdated(
        taskId,
        task.createdById,
        updatedTask.title,
      );

      const assignees = await this.assigneeRepository.findByTaskId(taskId);
      this.logger.log(
        `[UPDATE_TASK] Found ${assignees.length} assignees for task ${taskId}`,
      );

      for (const assignee of assignees) {
        if (assignee.userId !== userId) {
          this.logger.log(
            `[UPDATE_TASK] Sending notification to assignee ${assignee.userId}`,
          );
          await this.notificationPublisher.publishTaskUpdated(
            taskId,
            assignee.userId,
            updatedTask.title,
          );
        }
      }

      return updatedTask;
    });
  }

  async deleteTask(
    taskId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(`[DELETE_TASK] Deleting task ${taskId} for user ${userId}`);

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      this.logger.warn(`[DELETE_TASK] Task not found: ${taskId}`);
      throw new RpcException(
        RpcErrorHelper.NotFoundException('Task not found'),
      );
    }

    if (task.userId !== userId) {
      this.logger.warn(
        `[DELETE_TASK] User ${userId} does not have permission to delete task ${taskId}`,
      );
      throw new RpcException(
        RpcErrorHelper.NotFoundException('Task not found'),
      );
    }

    await this.taskRepository.delete(taskId);
    this.logger.log(`[DELETE_TASK] Task deleted successfully: ${taskId}`);

    return { success: true };
  }

  async addComment(
    taskId: string,
    userId: string,
    content: string,
  ): Promise<Comment> {
    this.logger.log(
      `[ADD_COMMENT] Adding comment to task ${taskId} by user ${userId}`,
    );

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      this.logger.warn(`[ADD_COMMENT] Task not found: ${taskId}`);
      throw new RpcException(
        RpcErrorHelper.NotFoundException('Task not found'),
      );
    }

    const comment = await this.commentRepository.create({
      taskId,
      userId,
      content,
    });

    this.logger.log(`[ADD_COMMENT] Comment added successfully: ${comment.id}`);

    const participants = new Set<string>();
    if (task.createdById) participants.add(task.createdById);
    const assignees = await this.assigneeRepository.findByTaskId(taskId);
    for (const a of assignees) participants.add(a.userId);

    participants.add(userId);

    for (const recipientUserId of participants) {
      await this.notificationPublisher.publishCommentCreatedForUser(
        taskId,
        task.title,
        recipientUserId,
        userId,
        content,
      );
    }

    return comment;
  }

  async getComments(
    taskId: string,
    userId: string,
    page: number = 1,
    size: number = 10,
  ) {
    this.logger.log(
      `[GET_COMMENTS] Getting comments for task ${taskId}, page ${page}, size ${size}`,
    );

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      this.logger.warn(`[GET_COMMENTS] Task not found: ${taskId}`);
      throw new RpcException(
        RpcErrorHelper.NotFoundException('Task not found'),
      );
    }

    const result = await this.commentRepository.findByTaskIdWithPagination(
      taskId,
      page,
      size,
    );

    this.logger.log(
      `[GET_COMMENTS] Found ${result.total} comments for task ${taskId}`,
    );
    return result;
  }
}
