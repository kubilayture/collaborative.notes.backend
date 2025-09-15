import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../users/dto';

export class ThreadParticipantDto {
  @ApiProperty({ description: 'User information' })
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @ApiProperty({ description: 'When user joined the thread' })
  @Expose()
  joinedAt: Date;

  @ApiProperty({ description: 'When user last read messages' })
  @Expose()
  lastReadAt: Date | null;
}

export class ThreadResponseDto {
  @ApiProperty({ description: 'Thread ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Thread name/title' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Thread creator' })
  @Expose()
  @Type(() => UserResponseDto)
  creator: UserResponseDto;

  @ApiProperty({
    description: 'Thread participants',
    type: [ThreadParticipantDto],
  })
  @Expose()
  @Type(() => ThreadParticipantDto)
  participants: ThreadParticipantDto[];

  @ApiProperty({ description: 'Latest message content preview' })
  @Expose()
  lastMessageContent: string | null;

  @ApiProperty({ description: 'Latest message timestamp' })
  @Expose()
  lastMessageAt: Date | null;

  @ApiProperty({ description: 'Unread message count for current user' })
  @Expose()
  unreadCount: number;

  @ApiProperty({ description: 'Thread creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Thread last update timestamp' })
  @Expose()
  updatedAt: Date;
}
