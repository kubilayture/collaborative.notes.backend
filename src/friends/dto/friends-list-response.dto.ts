import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserResponseDto } from '../../users/dto';

export class FriendListItemDto {
  @ApiProperty({ description: 'Friend user information' })
  @Expose()
  friend: UserResponseDto;

  @ApiProperty({ description: 'When friendship was established' })
  @Expose()
  friendsSince: Date;

  @ApiProperty({ description: 'Whether friend is currently online' })
  @Expose()
  isOnline: boolean;

  @ApiProperty({ description: 'Friend last seen timestamp', nullable: true })
  @Expose()
  lastSeenAt: Date | null;
}

export class FriendsListResponseDto {
  @ApiProperty({ description: 'List of friends', type: [FriendListItemDto] })
  @Expose()
  friends: FriendListItemDto[];

  @ApiProperty({ description: 'Total number of friends' })
  @Expose()
  total: number;
}