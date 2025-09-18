import { IsEmail, IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ description: 'The ID of the note to share' })
  @IsUUID()
  noteId: string;

  @ApiProperty({ description: 'Email address of the person to invite' })
  @IsEmail()
  inviteeEmail: string;

  @ApiProperty({
    description: 'Role to grant to the invitee',
    enum: ['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'],
    example: 'EDITOR',
  })
  @IsIn(['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'])
  role: string;
}
