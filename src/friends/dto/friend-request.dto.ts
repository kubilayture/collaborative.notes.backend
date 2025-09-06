import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({ description: 'Friend email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Optional message with the request', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}