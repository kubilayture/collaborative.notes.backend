import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ description: 'Note title', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Note content as JSON', required: false })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiProperty({
    description: 'Is note public',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Note tags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Note metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Folder ID to place the note in' })
  @IsOptional()
  @IsUUID()
  folderId?: string;
}
