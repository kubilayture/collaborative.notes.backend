import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateThreadDto {
  @ApiProperty({
    description: 'Thread name/title',
    example: 'Project Discussion',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: 'Array of participant user IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @ApiProperty({ description: 'Initial message content', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  initialMessage?: string;
}
