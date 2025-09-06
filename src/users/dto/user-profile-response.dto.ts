import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserProfileResponseDto {
  @ApiProperty({ description: 'Profile ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Username', nullable: true })
  @Expose()
  username: string | null;

  @ApiProperty({ description: 'Bio', nullable: true })
  @Expose()
  bio: string | null;

  @ApiProperty({ description: 'Avatar URL', nullable: true })
  @Expose()
  avatar: string | null;

  @ApiProperty({ description: 'Timezone', nullable: true })
  @Expose()
  timezone: string | null;

  @ApiProperty({ description: 'User preferences', nullable: true })
  @Expose()
  preferences: Record<string, any> | null;

  @ApiProperty({ description: 'Last seen timestamp', nullable: true })
  @Expose()
  lastSeenAt: Date | null;

  @ApiProperty({ description: 'Online status' })
  @Expose()
  isOnline: boolean;

  @ApiProperty({ description: 'Profile creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Profile last update timestamp' })
  @Expose()
  updatedAt: Date;
}
