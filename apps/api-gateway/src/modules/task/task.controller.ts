import { User } from '@/decorators/payload.decorator';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { firstValueFrom } from 'rxjs';
import { Logger } from 'winston';
import { CreateCommentDto } from './dto/request/create-comment.dto';
import { PaginationDto } from './dto/request/pagination.dto';
import { RequestCreateTaskDto } from './dto/request/request-create-task.dto';
import { UpdateTaskDto } from './dto/request/update-task.dto';
import { ResponseCreateTaskDto } from './dto/response/response-create-task';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@Throttle({ short: { limit: 10, ttl: 1000 } })
export class TaskController {
  constructor(
    @Inject('TASKS_SERVICE') private readonly tasksClient: ClientProxy,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create task',
    description: 'Creates a new task.',
  })
  @ApiBody({ type: RequestCreateTaskDto })
  @ApiCreatedResponse({
    description: 'Task created successfully',
    type: ResponseCreateTaskDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation errors.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            {
              type: 'array',
              items: { type: 'string' },
              example: ['title should not be empty', 'description is required'],
            },
            {
              type: 'string',
              example: 'Assignee emails are not valid',
            },
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized (missing/invalid Bearer token)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden (authenticated but not allowed)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Forbidden resource' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  async create(
    @User('sub') userId: string,
    @Body() requestCreateTaskDto: RequestCreateTaskDto,
  ) {
    this.logger.info(`Creating task for user ${userId}`, {
      userId,
      taskTitle: requestCreateTaskDto.title,
      assigneeCount: requestCreateTaskDto.assigneeEmails?.length || 0,
    });

    try {
      const task = await firstValueFrom(
        this.tasksClient.send('createTask', {
          ...requestCreateTaskDto,
          userId,
        }),
      );

      this.logger.info(`Task created successfully`, {
        taskId: task.id,
        userId,
        title: task.title,
      });

      return task;
    } catch (error) {
      this.logger.error(`Failed to create task for user ${userId}`, {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get tasks with pagination' })
  @ApiOkResponse({ description: 'Tasks retrieved successfully' })
  async getTasks(
    @User('sub') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    this.logger.info(`Getting tasks for user ${userId}`, {
      userId,
      page: paginationDto.page,
      size: paginationDto.size,
    });

    try {
      const result = await firstValueFrom(
        this.tasksClient.send('getTasks', {
          userId,
          page: paginationDto.page,
          size: paginationDto.size,
        }),
      );

      this.logger.info(`Tasks retrieved successfully`, {
        userId,
        total: result.total,
        page: result.page,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to get tasks for user ${userId}`, {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiOkResponse({ description: 'Task retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async getTask(@User('sub') userId: string, @Param('id') taskId: string) {
    this.logger.info(`Getting task ${taskId} for user ${userId}`);

    try {
      const task = await firstValueFrom(
        this.tasksClient.send('getTask', { taskId, userId }),
      );

      this.logger.info(`Task retrieved successfully`, {
        taskId,
        userId,
        title: task.title,
      });

      return task;
    } catch (error) {
      this.logger.error(`Failed to get task ${taskId}`, {
        taskId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiOkResponse({ description: 'Task updated successfully' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async updateTask(
    @User('sub') userId: string,
    @Param('id') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    this.logger.info(`Updating task ${taskId} for user ${userId}`, {
      taskId,
      userId,
      updates: updateTaskDto,
    });

    try {
      const task = await firstValueFrom(
        this.tasksClient.send('updateTask', {
          taskId,
          userId,
          ...updateTaskDto,
        }),
      );

      this.logger.info(`Task updated successfully`, {
        taskId,
        userId,
        title: task.title,
      });

      return task;
    } catch (error) {
      this.logger.error(`Failed to update task ${taskId}`, {
        taskId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiOkResponse({ description: 'Task deleted successfully' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async deleteTask(@User('sub') userId: string, @Param('id') taskId: string) {
    this.logger.info(`Deleting task ${taskId} for user ${userId}`);

    try {
      await firstValueFrom(
        this.tasksClient.send('deleteTask', { taskId, userId }),
      );

      this.logger.info(`Task deleted successfully`, {
        taskId,
        userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete task ${taskId}`, {
        taskId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to task' })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({ description: 'Comment created successfully' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async addComment(
    @User('sub') userId: string,
    @Param('id') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    this.logger.info(`Adding comment to task ${taskId}`, {
      taskId,
      userId,
      content: createCommentDto.content,
    });

    try {
      const comment = await firstValueFrom(
        this.tasksClient.send('addComment', {
          taskId,
          userId,
          content: createCommentDto.content,
        }),
      );

      this.logger.info(`Comment added successfully`, {
        taskId,
        userId,
        commentId: comment.id,
      });

      return comment;
    } catch (error) {
      this.logger.error(`Failed to add comment to task ${taskId}`, {
        taskId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get task comments with pagination' })
  @ApiOkResponse({ description: 'Comments retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  async getComments(
    @User('sub') userId: string,
    @Param('id') taskId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    this.logger.info(`Getting comments for task ${taskId}`, {
      taskId,
      userId,
      page: paginationDto.page,
      size: paginationDto.size,
    });

    try {
      const result = await firstValueFrom(
        this.tasksClient.send('getComments', {
          taskId,
          userId,
          page: paginationDto.page,
          size: paginationDto.size,
        }),
      );

      this.logger.info(`Comments retrieved successfully`, {
        taskId,
        userId,
        total: result.total,
        page: result.page,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to get comments for task ${taskId}`, {
        taskId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
