import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserResponseDto } from '../../users/dto';
import { NotePermissionResponseDto } from './note-permission-response.dto';

export class NoteResponseDto {
  @ApiProperty({ description: 'Note ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Note title' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Note content as JSON', nullable: true })
  @Expose()
  content: Record<string, any> | null;

  @ApiProperty({ description: 'Note owner ID' })
  @Expose()
  ownerId: string;

  @ApiProperty({ description: 'Note owner information', required: false })
  @Expose()
  owner?: UserResponseDto;

  @ApiProperty({ description: 'Is note public' })
  @Expose()
  isPublic: boolean;

  @ApiProperty({ description: 'Note tags', type: [String] })
  @Expose()
  tags: string[];

  @ApiProperty({ description: 'Note metadata', nullable: true })
  @Expose()
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'Note creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Note last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Note permissions',
    type: [NotePermissionResponseDto],
    required: false,
  })
  @Expose()
  permissions?: NotePermissionResponseDto[];
}
