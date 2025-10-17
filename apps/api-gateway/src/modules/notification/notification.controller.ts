import { User } from '@/decorators/payload.decorator';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';

@ApiTags('Notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get user notifications',
    description: 'Retrieves notifications for the authenticated user with optional limit'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of notifications to return',
    example: 20,
  })
  @ApiOkResponse({
    description: 'User notifications retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'notification-uuid' },
          type: { type: 'string', example: 'COMMENT_CREATED' },
          title: { type: 'string', example: 'Novo comentário - Implementar sistema de autenticação' },
          message: { type: 'string', example: 'Na tarefa "Implementar sistema de autenticação": Vou começar pela estrutura...' },
          isRead: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time', example: '2025-10-15T21:30:37.766Z' },
          taskId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
          data: { type: 'object' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired token',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  async getUserNotifications(
    @User('sub') userId: string,
    @Query('limit') limit?: number,
  ) {
    return firstValueFrom(
      this.notificationClient.send('getUserNotifications', { userId, limit }),
    );
  }

  @Post(':notificationId/read')
  @ApiOperation({ 
    summary: 'Mark notification as read',
    description: 'Marks a specific notification as read for the authenticated user'
  })
  @ApiParam({
    name: 'notificationId',
    description: 'Notification ID to mark as read',
    example: 'notification-uuid',
  })
  @ApiOkResponse({
    description: 'Notification marked as read',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired token',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  async markAsRead(
    @Param('notificationId') notificationId: string,
    @User('sub') userId: string,
  ) {
    await firstValueFrom(
      this.notificationClient.send('markAsRead', { notificationId, userId }),
    );
    return { success: true };
  }

  @Post('read-all')
  @ApiOperation({ 
    summary: 'Mark all notifications as read',
    description: 'Marks all notifications as read for the authenticated user'
  })
  @ApiOkResponse({
    description: 'All notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired token',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  async markAllAsRead(@User('sub') userId: string) {
           
    await firstValueFrom(
      this.notificationClient.send('markAllAsRead', { userId }),
    );
    return { success: true };
  }
}
