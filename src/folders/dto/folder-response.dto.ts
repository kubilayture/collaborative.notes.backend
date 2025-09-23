import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FolderResponseDto {
  @ApiProperty({ description: 'Folder ID' })
  id: string;

  @ApiProperty({ description: 'Folder name' })
  name: string;

  @ApiPropertyOptional({ description: 'Folder description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Folder color (hex)' })
  color?: string;

  @ApiProperty({ description: 'Owner ID' })
  ownerId: string;

  @ApiPropertyOptional({ description: 'Parent folder ID (null for root)' })
  parentId?: string | null;

  @ApiProperty({ description: 'Is system folder' })
  isSystem: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Number of notes in this folder' })
  noteCount?: number;

  @ApiPropertyOptional({ description: 'Number of subfolders' })
  subfolderCount?: number;
}
