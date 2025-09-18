import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NoteRole, InvitationStatus } from '../../entities';

class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;
}

class NoteResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty({ type: () => UserResponseDto })
  @Expose()
  @Type(() => UserResponseDto)
  owner?: UserResponseDto;
}

export class InvitationResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  token: string;

  @ApiProperty()
  @Expose()
  noteId: string;

  @ApiProperty({ type: () => NoteResponseDto })
  @Expose()
  @Type(() => NoteResponseDto)
  note?: NoteResponseDto;

  @ApiProperty()
  @Expose()
  inviterId: string;

  @ApiProperty({ type: () => UserResponseDto })
  @Expose()
  @Type(() => UserResponseDto)
  inviter?: UserResponseDto;

  @ApiProperty()
  @Expose()
  inviteeEmail: string;

  @ApiProperty()
  @Expose()
  inviteeId?: string;

  @ApiProperty({ type: () => UserResponseDto })
  @Expose()
  @Type(() => UserResponseDto)
  invitee?: UserResponseDto;

  @ApiProperty({ enum: NoteRole })
  @Expose()
  role: NoteRole;

  @ApiProperty({ enum: InvitationStatus })
  @Expose()
  status: InvitationStatus;

  @ApiProperty()
  @Expose()
  expiresAt: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
