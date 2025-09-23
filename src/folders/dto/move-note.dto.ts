import { IsUUID, IsOptional, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MoveNoteDto {
  @ApiPropertyOptional({
    description: 'Target folder ID (null to move to root)',
  })
  @IsOptional()
  @ValidateIf((o) => o.folderId !== null)
  @IsUUID()
  folderId?: string | null;
}
