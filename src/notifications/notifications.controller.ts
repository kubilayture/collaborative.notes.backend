import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '../entities';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  async list(
    @CurrentUser('id') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.notifications.list(userId, Number(page), Number(limit));
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get unread notification counts' })
  async counts(@CurrentUser('id') userId: string) {
    return this.notifications.getUnreadCounts(userId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  async markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.notifications.markRead(userId, id);
    return { ok: true };
  }

  @Post('mark-all-read')
  @ApiOperation({
    summary: 'Mark all notifications as read (optional by type)',
  })
  async markAllRead(
    @CurrentUser('id') userId: string,
    @Body('type') type?: NotificationType,
  ) {
    await this.notifications.markAllRead(userId, type);
    return { ok: true };
  }

  @Post('messages/read-thread/:threadId')
  @ApiOperation({
    summary: 'Mark all message notifications for thread as read',
  })
  async markThread(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
  ) {
    await this.notifications.markThreadMessagesRead(userId, threadId);
    return { ok: true };
  }
}
