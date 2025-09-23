import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Friend, FriendStatus, User, UserProfile } from '../entities';
import {
  SendFriendRequestDto,
  FriendResponseDto,
  FriendsListResponseDto,
  FriendListItemDto,
} from './dto';
import { plainToClass } from 'class-transformer';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../entities';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  async sendFriendRequest(
    userId: string,
    sendRequestDto: SendFriendRequestDto,
  ): Promise<FriendResponseDto> {
    const { email } = sendRequestDto;

    // Find the target user by email
    const targetUser = await this.usersService.findByEmail(email);
    if (!targetUser) {
      throw new NotFoundException('User not found with that email address');
    }

    // Can't send friend request to yourself
    if (targetUser.id === userId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if there's already a friendship or pending request
    const existingRelation = await this.friendRepository.findOne({
      where: [
        { requesterId: userId, addresseeId: targetUser.id },
        { requesterId: targetUser.id, addresseeId: userId },
      ],
    });

    if (existingRelation) {
      switch (existingRelation.status) {
        case FriendStatus.ACCEPTED:
          throw new ConflictException('You are already friends with this user');
        case FriendStatus.PENDING:
          if (existingRelation.requesterId === userId) {
            throw new ConflictException('Friend request already sent');
          } else {
            throw new ConflictException(
              'This user has already sent you a friend request',
            );
          }
        case FriendStatus.BLOCKED:
          throw new ConflictException(
            'Cannot send friend request to this user',
          );
        case FriendStatus.DECLINED:
          // Allow sending a new request after a decline
          await this.friendRepository.remove(existingRelation);
          break;
      }
    }

    // Create new friend request
    const friendRequest = await this.friendRepository.save({
      requesterId: userId,
      addresseeId: targetUser.id,
      status: FriendStatus.PENDING,
    });

    // Notify addressee
    const requester = await this.usersService.findById(userId);
    await this.notifications.create(
      targetUser.id,
      NotificationType.FRIEND_REQUEST,
      'Friend request',
      `${requester?.name || 'Someone'} sent you a friend request`,
      { requesterId: userId },
    );

    return this.getFriendRequestById(friendRequest.id);
  }

  async acceptFriendRequest(
    userId: string,
    requestId: string,
  ): Promise<FriendResponseDto> {
    const friendRequest = await this.friendRepository.findOne({
      where: {
        id: requestId,
        addresseeId: userId,
        status: FriendStatus.PENDING,
      },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found or not pending');
    }

    friendRequest.status = FriendStatus.ACCEPTED;
    await this.friendRepository.save(friendRequest);

    // Notify requester
    await this.notifications.create(
      friendRequest.requesterId,
      NotificationType.FRIEND_ACCEPTED,
      'Friend request accepted',
      'Your friend request was accepted',
      { byUserId: userId },
    );

    return this.getFriendRequestById(requestId);
  }

  async declineFriendRequest(userId: string, requestId: string): Promise<void> {
    const friendRequest = await this.friendRepository.findOne({
      where: {
        id: requestId,
        addresseeId: userId,
        status: FriendStatus.PENDING,
      },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found or not pending');
    }

    friendRequest.status = FriendStatus.DECLINED;
    await this.friendRepository.save(friendRequest);
  }

  async cancelFriendRequest(userId: string, requestId: string): Promise<void> {
    const friendRequest = await this.friendRepository.findOne({
      where: {
        id: requestId,
        requesterId: userId,
        status: FriendStatus.PENDING,
      },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found or not pending');
    }

    await this.friendRepository.remove(friendRequest);
  }

  async getFriends(userId: string): Promise<FriendsListResponseDto> {
    const friendRelations = await this.friendRepository
      .createQueryBuilder('friend')
      .leftJoinAndSelect('friend.requester', 'requester')
      .leftJoinAndSelect('friend.addressee', 'addressee')
      .where('(friend.requesterId = :userId OR friend.addresseeId = :userId)', {
        userId,
      })
      .andWhere('friend.status = :status', { status: FriendStatus.ACCEPTED })
      .orderBy('friend.updatedAt', 'DESC')
      .getMany();

    const friendIds = friendRelations.map((relation) =>
      relation.requesterId === userId
        ? relation.addresseeId
        : relation.requesterId,
    );

    // Get profiles for online status
    const profiles = await this.profileRepository.find({
      where: { userId: In(friendIds) },
    });

    const profilesMap = profiles.reduce(
      (acc, profile) => {
        acc[profile.userId] = profile;
        return acc;
      },
      {} as Record<string, UserProfile>,
    );

    const friends: FriendListItemDto[] = friendRelations.map((relation) => {
      const friend =
        relation.requesterId === userId
          ? relation.addressee
          : relation.requester;
      const profile = profilesMap[friend.id];

      // Create combined user response with profile data
      const combinedFriend = {
        ...friend,
        profile: profile || undefined,
      };

      return plainToClass(FriendListItemDto, {
        friend: combinedFriend,
        friendsSince: relation.updatedAt,
        isOnline: profile?.isOnline || false,
        lastSeenAt: profile?.lastSeenAt || null,
      });
    });

    return plainToClass(FriendsListResponseDto, {
      friends,
      total: friends.length,
    });
  }

  async getPendingRequests(userId: string): Promise<FriendResponseDto[]> {
    const requests = await this.friendRepository.find({
      where: { addresseeId: userId, status: FriendStatus.PENDING },
      relations: ['requester', 'addressee'],
      order: { createdAt: 'DESC' },
    });

    return requests.map((request) => plainToClass(FriendResponseDto, request));
  }

  async getSentRequests(userId: string): Promise<FriendResponseDto[]> {
    const requests = await this.friendRepository.find({
      where: { requesterId: userId, status: FriendStatus.PENDING },
      relations: ['requester', 'addressee'],
      order: { createdAt: 'DESC' },
    });

    return requests.map((request) => plainToClass(FriendResponseDto, request));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friendRelation = await this.friendRepository.findOne({
      where: [
        {
          requesterId: userId,
          addresseeId: friendId,
          status: FriendStatus.ACCEPTED,
        },
        {
          requesterId: friendId,
          addresseeId: userId,
          status: FriendStatus.ACCEPTED,
        },
      ],
    });

    if (!friendRelation) {
      throw new NotFoundException('Friend relationship not found');
    }

    await this.friendRepository.remove(friendRelation);
  }

  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const friendRelation = await this.friendRepository.findOne({
      where: [
        {
          requesterId: userId,
          addresseeId: friendId,
          status: FriendStatus.ACCEPTED,
        },
        {
          requesterId: friendId,
          addresseeId: userId,
          status: FriendStatus.ACCEPTED,
        },
      ],
    });

    return !!friendRelation;
  }

  private async getFriendRequestById(id: string): Promise<FriendResponseDto> {
    const friendRequest = await this.friendRepository.findOne({
      where: { id },
      relations: ['requester', 'addressee'],
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    // Get profiles for both users
    const profiles = await this.profileRepository.find({
      where: [
        { userId: friendRequest.requesterId },
        { userId: friendRequest.addresseeId },
      ],
    });

    const profilesMap = profiles.reduce(
      (acc, profile) => {
        acc[profile.userId] = profile;
        return acc;
      },
      {} as Record<string, UserProfile>,
    );

    // Create combined user data
    const requesterWithProfile = {
      ...friendRequest.requester,
      profile: profilesMap[friendRequest.requesterId] || undefined,
    };

    const addresseeWithProfile = {
      ...friendRequest.addressee,
      profile: profilesMap[friendRequest.addresseeId] || undefined,
    };

    return plainToClass(FriendResponseDto, {
      ...friendRequest,
      requester: requesterWithProfile,
      addressee: addresseeWithProfile,
    });
  }
}
