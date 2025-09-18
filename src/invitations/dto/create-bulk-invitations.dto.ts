import {
  IsEmail,
  IsUUID,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InvitationItem {
  @ApiProperty({ description: 'Email address of the person to invite' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Role to grant to the invitee',
    enum: ['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'],
    example: 'EDITOR',
  })
  @IsIn(['OWNER', 'EDITOR', 'COMMENTER', 'VIEWER'])
  role: string;
}

export class CreateBulkInvitationsDto {
  @ApiProperty({ description: 'The ID of the note to share' })
  @IsUUID()
  noteId: string;

  @ApiProperty({
    description: 'Array of invitations to create',
    type: [InvitationItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvitationItem)
  invitations: InvitationItem[];
}
