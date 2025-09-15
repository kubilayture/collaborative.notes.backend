import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({
    description: 'ID of message being replied to',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  replyToId?: string;
}
