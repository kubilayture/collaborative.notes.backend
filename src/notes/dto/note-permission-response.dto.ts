import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserResponseDto } from '../../users/dto';

export class NotePermissionResponseDto {
  @ApiProperty({ description: 'Permission ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Permission type', enum: ['READ', 'WRITE'] })
  @Expose()
  permission: 'READ' | 'WRITE';

  @ApiProperty({ description: 'User ID who has the permission' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'User ID who granted the permission' })
  @Expose()
  grantedById: string;

  @ApiProperty({ description: 'User information', required: false })
  @Expose()
  user?: UserResponseDto;

  @ApiProperty({ description: 'Permission creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Permission last update timestamp' })
  @Expose()
  updatedAt: Date;
}