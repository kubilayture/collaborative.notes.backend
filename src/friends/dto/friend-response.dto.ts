import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserResponseDto } from '../../users/dto';
import { FriendStatus } from '../../entities';

export class FriendResponseDto {
  @ApiProperty({ description: 'Friend relationship ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User who sent the request' })
  @Expose()
  requester: UserResponseDto;

  @ApiProperty({ description: 'User who received the request' })
  @Expose()
  addressee: UserResponseDto;

  @ApiProperty({ description: 'Friend request status', enum: FriendStatus })
  @Expose()
  status: FriendStatus;

  @ApiProperty({ description: 'Request creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Request last update timestamp' })
  @Expose()
  updatedAt: Date;
}
