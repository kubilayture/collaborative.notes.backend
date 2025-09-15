import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MessageResponseDto } from './message-response.dto';

export class MessagesListResponseDto {
  @ApiProperty({ description: 'List of messages', type: [MessageResponseDto] })
  @Expose()
  @Type(() => MessageResponseDto)
  messages: MessageResponseDto[];

  @ApiProperty({ description: 'Total number of messages in thread' })
  @Expose()
  total: number;

  @ApiProperty({ description: 'Current page number' })
  @Expose()
  page: number;

  @ApiProperty({ description: 'Number of messages per page' })
  @Expose()
  limit: number;

  @ApiProperty({ description: 'Whether there are more pages' })
  @Expose()
  hasMore: boolean;
}
