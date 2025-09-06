import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CreateThreadDto,
  SendMessageDto,
  ThreadResponseDto,
  MessageResponseDto,
  MessagesListResponseDto,
} from './dto';

@ApiTags('messaging')
@ApiBearerAuth()
@Controller('messaging')
@UseGuards(AuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('threads')
  @ApiOperation({ summary: 'Create a new message thread' })
  @ApiResponse({ status: 201, description: 'Thread created successfully', type: ThreadResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid participants or not friends' })
  @ApiResponse({ status: 403, description: 'Not friends with some participants' })
  async createThread(
    @CurrentUser('id') userId: string,
    @Body() createThreadDto: CreateThreadDto,
  ): Promise<ThreadResponseDto> {
    return this.messagingService.createThread(userId, createThreadDto);
  }

  @Get('threads')
  @ApiOperation({ summary: 'Get user message threads' })
  @ApiResponse({ status: 200, description: 'Threads retrieved', type: [ThreadResponseDto] })
  async getThreads(@CurrentUser('id') userId: string): Promise<ThreadResponseDto[]> {
    return this.messagingService.getThreads(userId);
  }

  @Get('threads/:threadId')
  @ApiOperation({ summary: 'Get thread details' })
  @ApiResponse({ status: 200, description: 'Thread details', type: ThreadResponseDto })
  @ApiResponse({ status: 403, description: 'Not a participant in this thread' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  async getThread(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
  ): Promise<ThreadResponseDto> {
    return this.messagingService.getThreadById(threadId, userId);
  }

  @Post('threads/:threadId/messages')
  @ApiOperation({ summary: 'Send a message to thread' })
  @ApiResponse({ status: 201, description: 'Message sent successfully', type: MessageResponseDto })
  @ApiResponse({ status: 403, description: 'Not a participant in this thread' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagingService.sendMessage(userId, threadId, sendMessageDto);
  }

  @Get('threads/:threadId/messages')
  @ApiOperation({ summary: 'Get messages from thread' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Messages per page (default: 50)' })
  @ApiResponse({ status: 200, description: 'Messages retrieved', type: MessagesListResponseDto })
  @ApiResponse({ status: 403, description: 'Not a participant in this thread' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<MessagesListResponseDto> {
    return this.messagingService.getMessages(userId, threadId, page, limit);
  }

  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully', type: MessageResponseDto })
  @ApiResponse({ status: 403, description: 'Can only edit your own messages' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async editMessage(
    @CurrentUser('id') userId: string,
    @Param('messageId') messageId: string,
    @Body('content') content: string,
  ): Promise<MessageResponseDto> {
    return this.messagingService.editMessage(userId, messageId, content);
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 204, description: 'Message deleted successfully' })
  @ApiResponse({ status: 403, description: 'Can only delete your own messages' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @CurrentUser('id') userId: string,
    @Param('messageId') messageId: string,
  ): Promise<void> {
    return this.messagingService.deleteMessage(userId, messageId);
  }

  @Post('threads/:threadId/participants/:participantId')
  @ApiOperation({ summary: 'Add participant to thread' })
  @ApiResponse({ status: 200, description: 'Participant added successfully', type: ThreadResponseDto })
  @ApiResponse({ status: 400, description: 'User already a participant' })
  @ApiResponse({ status: 403, description: 'Not authorized or not friends with participant' })
  @ApiResponse({ status: 404, description: 'Thread or user not found' })
  async addParticipant(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
    @Param('participantId') participantId: string,
  ): Promise<ThreadResponseDto> {
    return this.messagingService.addParticipant(userId, threadId, participantId);
  }

  @Delete('threads/:threadId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave a message thread' })
  @ApiResponse({ status: 204, description: 'Left thread successfully' })
  @ApiResponse({ status: 400, description: 'Not a participant in thread' })
  @ApiResponse({ status: 404, description: 'Thread not found' })
  async leaveThread(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
  ): Promise<void> {
    return this.messagingService.leaveThread(userId, threadId);
  }
}