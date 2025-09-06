import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User name', nullable: true })
  @Expose()
  name: string | null;

  @ApiProperty({ description: 'User email' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User profile image URL', nullable: true })
  @Expose()
  image: string | null;

  @ApiProperty({ description: 'Email verification status', nullable: true })
  @Expose()
  emailVerified: Date | null;

  @ApiProperty({ description: 'User creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'User last update timestamp' })
  @Expose()
  updatedAt: Date;

  @Exclude()
  private?: any;
}
