import { IsUUID, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MoveNoteDto {
  @ApiPropertyOptional({
    description: 'Target folder ID (null to move to root)',
  })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;
}
