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
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { firstValueFrom } from 'rxjs';
import { Logger } from 'winston';
import { CreateCommentDto } from './dto/request/create-comment.dto';
import { RequestPaginationDto } from './dto/request/request-pagination.dto';
import { RequestCreateTaskDto } from './dto/request/request-create-task.dto';
import { UpdateTaskDto } from './dto/request/update-task.dto';
import { ResponseCreateTaskDto } from './dto/response/response-create-task';
import { ResponseTasksPaginatedDto } from './dto/response/response-tasks-paginated.dto';

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
  @ApiBody({
    type: RequestCreateTaskDto,
    description: 'Task creation data',
    examples: {
      example1: {
        summary: 'Create a high priority task',
        description: 'Example of creating a high priority task with multiple assignees',
        value: {
          title: 'Implement user authentication',
          description: 'Create login and registration endpoints with JWT authentication',
          deadline: '2024-12-25T23:59:59.000Z',
          priority: 'HIGH',
          status: 'TODO',
          assigneeEmails: ['user1@example.com', 'user2@example.com']
        }
      },
      example2: {
        summary: 'Create a medium priority task',
        description: 'Example of creating a medium priority task with single assignee',
        value: {
          title: 'Update documentation',
          description: 'Update API documentation with new endpoints',
          deadline: '2024-12-30T18:00:00.000Z',
          priority: 'MEDIUM',
          status: 'TODO',
          assigneeEmails: ['developer@example.com']
        }
      }
    }
  })
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
     @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
        },
        statusCode: {
          type: 'number',
          example: 401,
        },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
        error: {
          type: 'string',
          example: 'Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'Forbidden (authenticated but not allowed)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Forbidden resource',
        },
        error: {
          type: 'string',
          example: 'Forbidden',
        },
        statusCode: {
          type: 'number',
          example: 403,
        },
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
        errorType: error?.constructor?.name || typeof error,
        errorDetails: JSON.stringify(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get tasks with pagination and filters',
    description: 'Retrieves a paginated list of tasks for the authenticated user. Supports pagination, search by text, and filtering by status and priority.'
  })
  @ApiOkResponse({ 
    description: 'Tasks retrieved successfully',
    type: ResponseTasksPaginatedDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Search query for title and description (case-insensitive)',
    example: 'login',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
    description: 'Filter by task status',
    example: 'IN_PROGRESS',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    description: 'Filter by priority level',
    example: 'HIGH',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
        },
        statusCode: {
          type: 'number',
          example: 401,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
        },
      },
    },
  })
 @ApiTooManyRequestsResponse({
    description: 'Too many requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
        error: {
          type: 'string',
          example: 'Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
  async getTasks(
    @User('sub') userId: string,
    @Query() paginationDto: RequestPaginationDto,
  ) {
    this.logger.info(`Getting all tasks (admin view)`, {
      userId,
      page: paginationDto.page,
      size: paginationDto.size,
    });

    try {
      const result = await firstValueFrom(
        this.tasksClient.send('getAllTasks', {
          page: paginationDto.page,
          size: paginationDto.size,
          q: paginationDto.q,
          status: paginationDto.status,
          priority: paginationDto.priority,
        }),
      );

      this.logger.info(`All tasks retrieved successfully`, {
        userId,
        total: result.total,
        page: result.page,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to get all tasks`, {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiOkResponse({ description: 'Task retrieved successfully' }) @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
        },
        statusCode: {
          type: 'number',
          example: 401,
        },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
        error: {
          type: 'string',
          example: 'Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Task not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
        },
      },
    },
  })
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
     @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
        },
        statusCode: {
          type: 'number',
          example: 401,
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Task updated successfully' })
  @ApiNotFoundResponse({
    description: 'Task not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Task not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
        },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
        error: {
          type: 'string',
          example: 'Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
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
      this.logger.info(`Sending updateTask message to Tasks Service`, {
        taskId,
        userId,
        updates: updateTaskDto,
      });

      const task = await firstValueFrom(
        this.tasksClient.send('updateTask', {
          taskId,
          userId,
          updates: updateTaskDto,
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
        errorDetails: JSON.stringify(error),
        errorType: error?.constructor?.name || typeof error,
      });
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiOkResponse({ description: 'Task deleted successfully' })
     @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
        },
        statusCode: {
          type: 'number',
          example: 401,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Task not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
        },
      },
    },
  })
    @ApiTooManyRequestsResponse({
    description: 'Too many requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
        error: {
          type: 'string',
          example: 'Too Many Requests',
        },
        statusCode: {
          type: 'number',
          example: 429,
        },
      },
    },
  })
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
     @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
        },
        statusCode: {
          type: 'number',
          example: 401,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Task not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
        },
      },
    },
  })
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
     @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        error: {
          type: 'string',
          example: 'Unauthorized',
        },
        statusCode: {
          type: 'number',
          example: 401,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Task not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Task not found',
        },
        error: {
          type: 'string',
          example: 'Not Found',
        },
        statusCode: {
          type: 'number',
          example: 404,
        },
      },
    },
  })
  async getComments(
    @User('sub') userId: string,
    @Param('id') taskId: string,
    @Query() paginationDto: RequestPaginationDto,
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
