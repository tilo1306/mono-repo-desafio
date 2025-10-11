import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
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
  constructor(
    @Inject('ITaskRepository')
    private readonly taskRepository: ITaskRepository,
    @Inject('IAssigneeRepository')
    private readonly assigneeRepository: IAssigneeRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ICommentRepository')
    private readonly commentRepository: ICommentRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly notificationPublisher: NotificationPublisherService,
  ) {}

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    this.logger.log(
      `Creating task: ${createTaskDto.title} for user: ${createTaskDto.userId}`,
    );

    const isUserExists = await this.userRepository.findById(
      createTaskDto.userId,
    );

    if (!isUserExists) {
      this.logger.warn(`User not found: ${createTaskDto.userId}`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User validated: ${isUserExists.email}`);

    const assigneeEmails = createTaskDto.assigneeEmails.map(email => email);
    this.logger.log(
      `Validating ${assigneeEmails.length} assignees: ${assigneeEmails.join(', ')}`,
    );

    const isAssigneeExists =
      await this.userRepository.findManyByEmails(assigneeEmails);

    if (isAssigneeExists.length !== assigneeEmails.length) {
      this.logger.warn(
        `Invalid assignee emails. Expected: ${assigneeEmails.length}, Found: ${isAssigneeExists.length}`,
      );
      throw new BadRequestException('Assignee emails are not valid');
    }

    this.logger.log(`All assignees validated successfully`);

    const task = await this.taskRepository.create(createTaskDto);
    this.logger.log(`Task created successfully: ${task.id}`);

    await this.notificationPublisher.publishTaskCreated(
      task.id,
      createTaskDto.userId,
      task.title,
    );
    this.logger.log(`Global task created notification published`);

    for (const assignee of isAssigneeExists) {
      await this.assigneeRepository.create({
        taskId: task.id,
        userId: assignee.id,
      });

      await this.notificationPublisher.publishTaskAssigned(
        task.id,
        assignee.id,
        task.title,
      );

      this.logger.log(
        `Assignee created and notified: ${assignee.email} (${assignee.id})`,
      );
    }

    this.logger.log(`Task creation completed successfully: ${task.id}`);
    return task;
  }

  async getTasks(userId: string, page: number = 1, size: number = 10) {
    this.logger.log(
      `Getting tasks for user ${userId}, page ${page}, size ${size}`,
    );

    const result = await this.taskRepository.findByUserIdWithPagination(
      userId,
      page,
      size,
    );

    this.logger.log(`Found ${result.total} tasks for user ${userId}`);
    return result;
  }

  async getTask(taskId: string, userId: string): Promise<Task> {
    this.logger.log(`Getting task ${taskId} for user ${userId}`);

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      this.logger.warn(`Task not found: ${taskId}`);
      throw new NotFoundException('Task not found');
    }

    const hasAccess = await this.taskRepository.hasUserAccess(taskId, userId);
    if (!hasAccess) {
      this.logger.warn(`User ${userId} does not have access to task ${taskId}`);
      throw new NotFoundException('Task not found');
    }

    this.logger.log(`Task retrieved successfully: ${taskId}`);
    return task;
  }

  async updateTask(
    taskId: string,
    userId: string,
    updates: any,
  ): Promise<Task> {
    this.logger.log(`Updating task ${taskId} for user ${userId}`, { updates });

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      this.logger.warn(`Task not found: ${taskId}`);
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      this.logger.warn(
        `User ${userId} does not have permission to edit task ${taskId}`,
      );
      throw new NotFoundException('Task not found');
    }

    const updatedTask = await this.taskRepository.update(taskId, updates);
    if (!updatedTask) {
      this.logger.warn(`Failed to update task: ${taskId}`);
      throw new NotFoundException('Task not found');
    }

    this.logger.log(`Task updated successfully: ${taskId}`);

    await this.notificationPublisher.publishTaskUpdated(
      taskId,
      userId,
      updatedTask.title,
    );

    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting task ${taskId} for user ${userId}`);

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      this.logger.warn(`Task not found: ${taskId}`);
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      this.logger.warn(
        `User ${userId} does not have permission to delete task ${taskId}`,
      );
      throw new NotFoundException('Task not found');
    }

    await this.taskRepository.delete(taskId);
    this.logger.log(`Task deleted successfully: ${taskId}`);
  }

  async addComment(
    taskId: string,
    userId: string,
    content: string,
  ): Promise<Comment> {
    this.logger.log(`Adding comment to task ${taskId} by user ${userId}`);

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      this.logger.warn(`Task not found: ${taskId}`);
      throw new NotFoundException('Task not found');
    }

    const hasAccess = await this.taskRepository.hasUserAccess(taskId, userId);
    if (!hasAccess) {
      this.logger.warn(`User ${userId} does not have access to task ${taskId}`);
      throw new NotFoundException('Task not found');
    }

    const comment = await this.commentRepository.create({
      taskId,
      userId,
      content,
    });

    this.logger.log(`Comment added successfully: ${comment.id}`);

    await this.notificationPublisher.publishCommentCreated(
      taskId,
      userId,
      content,
    );

    return comment;
  }

  async getComments(
    taskId: string,
    userId: string,
    page: number = 1,
    size: number = 10,
  ) {
    this.logger.log(
      `Getting comments for task ${taskId}, page ${page}, size ${size}`,
    );

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      this.logger.warn(`Task not found: ${taskId}`);
      throw new NotFoundException('Task not found');
    }

    const hasAccess = await this.taskRepository.hasUserAccess(taskId, userId);
    if (!hasAccess) {
      this.logger.warn(`User ${userId} does not have access to task ${taskId}`);
      throw new NotFoundException('Task not found');
    }

    const result = await this.commentRepository.findByTaskIdWithPagination(
      taskId,
      page,
      size,
    );

    this.logger.log(`Found ${result.total} comments for task ${taskId}`);
    return result;
  }
}
