import {
  IsString,
  IsOptional,
  MaxLength,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({ description: 'Folder name', example: 'My Projects' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Folder description',
    example: 'Contains all my project notes',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Folder color (hex)',
    example: '#3b82f6',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color code',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Parent folder ID',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
