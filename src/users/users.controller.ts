import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard, CurrentUser } from '../auth';
import { UsersService } from './users.service';
import {
  CombinedUserResponseDto,
  UpdateProfileDto,
  UpdateSettingsDto,
  UserProfileResponseDto,
  UserSettingsResponseDto,
} from './dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user data with profile',
    type: CombinedUserResponseDto,
  })
  async getCurrentUser(
    @CurrentUser() user: any,
  ): Promise<CombinedUserResponseDto> {
    return this.usersService.getCurrentUser(user.id);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Updated user profile',
    type: UserProfileResponseDto,
  })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateData: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(user.id, updateData);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({
    name: 'limit',
    description: 'Result limit',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [CombinedUserResponseDto],
  })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<CombinedUserResponseDto[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Query must be at least 2 characters long');
    }

    const resultLimit = limit ? parseInt(limit, 10) : 10;
    if (isNaN(resultLimit) || resultLimit < 1 || resultLimit > 50) {
      throw new BadRequestException('Limit must be between 1 and 50');
    }

    return this.usersService.searchUsers(query.trim(), resultLimit);
  }

  @Get('me/settings')
  @ApiOperation({ summary: 'Get current user settings' })
  @ApiResponse({
    status: 200,
    description: 'Current user settings',
    type: UserSettingsResponseDto,
  })
  async getUserSettings(
    @CurrentUser() user: any,
  ): Promise<UserSettingsResponseDto> {
    return this.usersService.getOrCreateSettings(user.id);
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({
    status: 200,
    description: 'Updated user settings',
    type: UserSettingsResponseDto,
  })
  async updateUserSettings(
    @CurrentUser() user: any,
    @Body() updateData: UpdateSettingsDto,
  ): Promise<UserSettingsResponseDto> {
    return this.usersService.updateSettings(user.id, updateData);
  }
}
