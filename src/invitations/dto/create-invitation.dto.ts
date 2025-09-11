import { IsEmail, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NoteRole } from '../../entities';

export class CreateInvitationDto {
  @ApiProperty({ description: 'The ID of the note to share' })
  @IsUUID()
  noteId: string;

  @ApiProperty({ description: 'Email address of the person to invite' })
  @IsEmail()
  inviteeEmail: string;

  @ApiProperty({ 
    description: 'Role to grant to the invitee',
    enum: NoteRole,
    example: NoteRole.EDITOR
  })
  @IsEnum(NoteRole)
  role: NoteRole;
}