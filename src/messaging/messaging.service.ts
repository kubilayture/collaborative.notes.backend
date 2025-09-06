import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MessageThread, Message, User } from '../entities';
import {
  CreateThreadDto,
  SendMessageDto,
  ThreadResponseDto,
  MessageResponseDto,
  MessagesListResponseDto,
  ThreadParticipantDto,
} from './dto';
import { plainToClass } from 'class-transformer';
import { FriendsService } from '../friends/friends.service';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(MessageThread)
    private readonly threadRepository: Repository<MessageThread>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly friendsService: FriendsService,
  ) {}

  async createThread(
    userId: string,
    createThreadDto: CreateThreadDto,
  ): Promise<ThreadResponseDto> {
    const { name, participantIds, initialMessage } = createThreadDto;

    // Verify all participants exist and are friends with the creator
    const participants = await this.userRepository.find({
      where: { id: In(participantIds) },
    });

    if (participants.length !== participantIds.length) {
      throw new BadRequestException('Some participant users not found');
    }

    // Check if creator is friends with all participants
    for (const participantId of participantIds) {
      if (participantId !== userId) {
        const areFriends = await this.friendsService.areFriends(
          userId,
          participantId,
        );
        if (!areFriends) {
          throw new ForbiddenException(
            `You are not friends with user ${participantId}`,
          );
        }
      }
    }

    // Add creator to participants if not already included
    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }

    // Create thread
    const thread = await this.threadRepository.save({
      name,
      creatorId: userId,
      participantIds,
    });

    // Send initial message if provided
    if (initialMessage) {
      await this.messageRepository.save({
        content: initialMessage,
        senderId: userId,
        threadId: thread.id,
      });
    }

    return this.getThreadById(thread.id, userId);
  }

  async getThreads(userId: string): Promise<ThreadResponseDto[]> {
    const threads = await this.threadRepository
      .createQueryBuilder('thread')
      .leftJoinAndSelect('thread.creator', 'creator')
      .leftJoin('thread.messages', 'messages')
      .where(':userId = ANY(thread.participantIds)', { userId })
      .orderBy('COALESCE(MAX(messages.createdAt), thread.createdAt)', 'DESC')
      .groupBy('thread.id, creator.id')
      .getMany();

    const threadResponses = await Promise.all(
      threads.map((thread) => this.getThreadById(thread.id, userId)),
    );

    return threadResponses;
  }

  async getThreadById(
    threadId: string,
    userId: string,
  ): Promise<ThreadResponseDto> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId },
      relations: ['creator'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Check if user is a participant
    if (!thread.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this thread');
    }

    // Get participants info
    const participants = await this.userRepository.find({
      where: { id: In(thread.participantIds) },
    });

    const participantDtos = participants.map((user) =>
      plainToClass(ThreadParticipantDto, {
        user,
        joinedAt: thread.createdAt, // For now, all join at thread creation
        lastReadAt: null, // TODO: Implement read tracking
      }),
    );

    // Get latest message info
    const latestMessage = await this.messageRepository.findOne({
      where: { threadId },
      order: { createdAt: 'DESC' },
    });

    // Get unread count (for now, return 0 - TODO: implement read tracking)
    const unreadCount = 0;

    return plainToClass(ThreadResponseDto, {
      id: thread.id,
      name: thread.name,
      creator: thread.creator,
      participants: participantDtos,
      lastMessageContent: latestMessage?.content || null,
      lastMessageAt: latestMessage?.createdAt || null,
      unreadCount,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    });
  }

  async sendMessage(
    userId: string,
    threadId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const { content, replyToId } = sendMessageDto;

    // Check if thread exists and user is participant
    const thread = await this.threadRepository.findOne({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (!thread.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this thread');
    }

    // Verify reply-to message if provided
    if (replyToId) {
      const replyToMessage = await this.messageRepository.findOne({
        where: { id: replyToId, threadId },
      });

      if (!replyToMessage) {
        throw new BadRequestException(
          'Reply-to message not found in this thread',
        );
      }
    }

    // Create message
    const message = await this.messageRepository.save({
      content,
      senderId: userId,
      threadId,
      replyToId: replyToId || null,
    });

    return this.getMessageById(message.id);
  }

  async getMessages(
    userId: string,
    threadId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<MessagesListResponseDto> {
    // Check if thread exists and user is participant
    const thread = await this.threadRepository.findOne({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (!thread.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this thread');
    }

    const offset = (page - 1) * limit;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { threadId },
      relations: ['sender', 'replyTo', 'replyTo.sender'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    // Reverse to show messages in chronological order
    const messagesDto = messages
      .reverse()
      .map((message) => plainToClass(MessageResponseDto, message));

    return plainToClass(MessagesListResponseDto, {
      messages: messagesDto,
      total,
      page,
      limit,
      hasMore: offset + messages.length < total,
    });
  }

  async editMessage(
    userId: string,
    messageId: string,
    content: string,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['thread'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Check if user is still a participant in the thread
    const thread = await this.threadRepository.findOne({
      where: { id: message.threadId },
    });

    if (!thread || !thread.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this thread');
    }

    // Update message
    message.content = content;
    message.isEdited = true;
    await this.messageRepository.save(message);

    return this.getMessageById(messageId);
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['thread'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Check if user is still a participant in the thread
    const thread = await this.threadRepository.findOne({
      where: { id: message.threadId },
    });

    if (!thread || !thread.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this thread');
    }

    await this.messageRepository.remove(message);
  }

  async addParticipant(
    userId: string,
    threadId: string,
    participantId: string,
  ): Promise<ThreadResponseDto> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Check if user is the creator or existing participant
    if (
      thread.creatorId !== userId &&
      !thread.participantIds.includes(userId)
    ) {
      throw new ForbiddenException(
        'Only thread creator or participants can add new members',
      );
    }

    // Check if new participant exists
    const newParticipant = await this.userRepository.findOne({
      where: { id: participantId },
    });

    if (!newParticipant) {
      throw new NotFoundException('User to add not found');
    }

    // Check if user is already a participant
    if (thread.participantIds.includes(participantId)) {
      throw new BadRequestException('User is already a participant');
    }

    // Check if creator/adder is friends with the new participant
    const areFriends = await this.friendsService.areFriends(
      userId,
      participantId,
    );
    if (!areFriends) {
      throw new ForbiddenException('You can only add friends to threads');
    }

    // Add participant
    thread.participantIds.push(participantId);
    await this.threadRepository.save(thread);

    return this.getThreadById(threadId, userId);
  }

  async leaveThread(userId: string, threadId: string): Promise<void> {
    const thread = await this.threadRepository.findOne({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (!thread.participantIds.includes(userId)) {
      throw new BadRequestException('You are not a participant in this thread');
    }

    // Remove user from participants
    thread.participantIds = thread.participantIds.filter((id) => id !== userId);

    // If no participants left, delete the thread
    if (thread.participantIds.length === 0) {
      await this.threadRepository.remove(thread);
      return;
    }

    // If creator leaves, assign a new creator
    if (thread.creatorId === userId) {
      thread.creatorId = thread.participantIds[0];
    }

    await this.threadRepository.save(thread);
  }

  private async getMessageById(messageId: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'replyTo', 'replyTo.sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return plainToClass(MessageResponseDto, message);
  }
}
