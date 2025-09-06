import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../users/dto';

export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Message content' })
  @Expose()
  content: string;

  @ApiProperty({ description: 'Message sender' })
  @Expose()
  @Type(() => UserResponseDto)
  sender: UserResponseDto;

  @ApiProperty({ description: 'Thread ID' })
  @Expose()
  threadId: string;

  @ApiProperty({ description: 'Message being replied to', nullable: true })
  @Expose()
  @Type(() => MessageResponseDto)
  replyTo: MessageResponseDto | null;

  @ApiProperty({ description: 'Whether message was edited' })
  @Expose()
  isEdited: boolean;

  @ApiProperty({ description: 'Message creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Message last update timestamp' })
  @Expose()
  updatedAt: Date;
}
