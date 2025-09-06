import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  SendFriendRequestDto,
  FriendResponseDto,
  FriendsListResponseDto,
} from './dto';

@ApiTags('friends')
@ApiBearerAuth()
@Controller('friends')
@UseGuards(AuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({
    status: 201,
    description: 'Friend request sent successfully',
    type: FriendResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or self-request',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - already friends or request exists',
  })
  async sendFriendRequest(
    @CurrentUser('id') userId: string,
    @Body() sendRequestDto: SendFriendRequestDto,
  ): Promise<FriendResponseDto> {
    return this.friendsService.sendFriendRequest(userId, sendRequestDto);
  }

  @Post(':requestId/accept')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiResponse({
    status: 200,
    description: 'Friend request accepted',
    type: FriendResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Friend request not found or not pending',
  })
  async acceptFriendRequest(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ): Promise<FriendResponseDto> {
    return this.friendsService.acceptFriendRequest(userId, requestId);
  }

  @Post(':requestId/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Decline a friend request' })
  @ApiResponse({ status: 204, description: 'Friend request declined' })
  @ApiResponse({
    status: 404,
    description: 'Friend request not found or not pending',
  })
  async declineFriendRequest(
    @CurrentUser('id') userId: string,
    @Param('requestId') requestId: string,
  ): Promise<void> {
    return this.friendsService.declineFriendRequest(userId, requestId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user friends list' })
  @ApiResponse({
    status: 200,
    description: 'Friends list retrieved',
    type: FriendsListResponseDto,
  })
  async getFriends(
    @CurrentUser('id') userId: string,
  ): Promise<FriendsListResponseDto> {
    return this.friendsService.getFriends(userId);
  }

  @Get('requests/received')
  @ApiOperation({ summary: 'Get received friend requests' })
  @ApiResponse({
    status: 200,
    description: 'Pending friend requests',
    type: [FriendResponseDto],
  })
  async getPendingRequests(
    @CurrentUser('id') userId: string,
  ): Promise<FriendResponseDto[]> {
    return this.friendsService.getPendingRequests(userId);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Get sent friend requests' })
  @ApiResponse({
    status: 200,
    description: 'Sent friend requests',
    type: [FriendResponseDto],
  })
  async getSentRequests(
    @CurrentUser('id') userId: string,
  ): Promise<FriendResponseDto[]> {
    return this.friendsService.getSentRequests(userId);
  }

  @Delete(':friendId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a friend' })
  @ApiResponse({ status: 204, description: 'Friend removed successfully' })
  @ApiResponse({ status: 404, description: 'Friend relationship not found' })
  async removeFriend(
    @CurrentUser('id') userId: string,
    @Param('friendId') friendId: string,
  ): Promise<void> {
    return this.friendsService.removeFriend(userId, friendId);
  }

  @Get(':friendId/status')
  @ApiOperation({ summary: 'Check if users are friends' })
  @ApiResponse({
    status: 200,
    description: 'Friendship status',
    schema: { type: 'object', properties: { areFriends: { type: 'boolean' } } },
  })
  async checkFriendship(
    @CurrentUser('id') userId: string,
    @Param('friendId') friendId: string,
  ): Promise<{ areFriends: boolean }> {
    const areFriends = await this.friendsService.areFriends(userId, friendId);
    return { areFriends };
  }
}
