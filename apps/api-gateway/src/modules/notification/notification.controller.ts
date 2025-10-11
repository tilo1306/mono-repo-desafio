import { User } from '@/decorators/payload.decorator';
import { Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: 200,
    description: 'User notifications retrieved successfully',
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
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
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
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@User('sub') userId: string) {
    await firstValueFrom(
      this.notificationClient.send('markAllAsRead', { userId }),
    );
    return { success: true };
  }
}
