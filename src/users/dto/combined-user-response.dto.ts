import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';
import { UserProfileResponseDto } from './user-profile-response.dto';

export class CombinedUserResponseDto extends UserResponseDto {
  @ApiProperty({ description: 'User profile', required: false })
  @Expose()
  profile?: UserProfileResponseDto;
}
