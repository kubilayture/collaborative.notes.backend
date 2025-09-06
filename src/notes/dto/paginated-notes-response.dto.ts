import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { NoteResponseDto } from './note-response.dto';

export class PaginatedNotesResponseDto {
  @ApiProperty({ description: 'Array of notes', type: [NoteResponseDto] })
  @Expose()
  notes: NoteResponseDto[];

  @ApiProperty({ description: 'Total number of notes' })
  @Expose()
  total: number;

  @ApiProperty({ description: 'Current page number' })
  @Expose()
  page: number;

  @ApiProperty({ description: 'Number of notes per page' })
  @Expose()
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  @Expose()
  pages: number;

  @ApiProperty({ description: 'Has next page' })
  @Expose()
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  @Expose()
  hasPrev: boolean;
}