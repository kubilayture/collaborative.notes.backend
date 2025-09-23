import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { User, UserProfile, UserSettings } from '../entities';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { plainToClass } from 'class-transformer';
import {
  CombinedUserResponseDto,
  UserProfileResponseDto,
  UserSettingsResponseDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectRepository(UserSettings)
    private readonly settingsRepository: Repository<UserSettings>,
  ) {}

  async findById(id: string): Promise<CombinedUserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const profile = await this.profileRepository.findOne({
      where: { userId: id },
    });

    return plainToClass(CombinedUserResponseDto, {
      ...user,
      profile: profile || undefined,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async searchUsers(
    query: string,
    limit = 10,
  ): Promise<CombinedUserResponseDto[]> {
    const users = await this.userRepository.find({
      where: [{ name: Like(`%${query}%`) }, { email: Like(`%${query}%`) }],
      take: limit,
    });

    const userIds = users.map((u) => u.id);
    const profiles = await this.profileRepository.find({
      where: { userId: In(userIds) },
    });

    const profilesMap = profiles.reduce(
      (acc, profile) => {
        acc[profile.userId] = profile;
        return acc;
      },
      {} as Record<string, UserProfile>,
    );

    return users.map((user) =>
      plainToClass(CombinedUserResponseDto, {
        ...user,
        profile: profilesMap[user.id] || undefined,
      }),
    );
  }

  async getCurrentUser(userId: string): Promise<CombinedUserResponseDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserById(userId: string): Promise<CombinedUserResponseDto> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getOrCreateProfile(userId: string): Promise<UserProfileResponseDto> {
    let profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = await this.profileRepository.save({
        userId,
        isOnline: true,
        lastSeenAt: new Date(),
      });
    }

    return plainToClass(UserProfileResponseDto, profile);
  }

  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    let profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = await this.profileRepository.save({
        userId,
        ...updateData,
        isOnline: true,
        lastSeenAt: new Date(),
      });
    } else {
      await this.profileRepository.update(
        { userId },
        {
          ...updateData,
          updatedAt: new Date(),
        },
      );
      profile = await this.profileRepository.findOne({
        where: { userId },
      });
    }

    return plainToClass(UserProfileResponseDto, profile!);
  }

  async updateLastSeen(userId: string): Promise<void> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (profile) {
      await this.profileRepository.update(
        { userId },
        {
          lastSeenAt: new Date(),
          isOnline: true,
        },
      );
    } else {
      await this.profileRepository.save({
        userId,
        isOnline: true,
        lastSeenAt: new Date(),
      });
    }
  }

  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    const updateData: Partial<UserProfile> = {
      isOnline,
      ...(isOnline ? {} : { lastSeenAt: new Date() }),
    };

    if (profile) {
      await this.profileRepository.update({ userId }, updateData);
    } else {
      await this.profileRepository.save({
        userId,
        ...updateData,
      });
    }
  }

  async getOrCreateSettings(userId: string): Promise<UserSettingsResponseDto> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = await this.settingsRepository.save({
        userId,
        theme: 'system',
        language: 'en',
        emailNotifications: true,
        pushNotifications: true,
        desktopNotifications: true,
        soundNotifications: true,
        autoSaveInterval: 30,
        defaultEditorMode: 'rich',
        showLineNumbers: false,
        wordWrap: true,
      });
    }

    return plainToClass(UserSettingsResponseDto, settings);
  }

  async updateSettings(
    userId: string,
    updateData: UpdateSettingsDto,
  ): Promise<UserSettingsResponseDto> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = await this.settingsRepository.save({
        userId,
        theme: 'system',
        language: 'en',
        emailNotifications: true,
        pushNotifications: true,
        desktopNotifications: true,
        soundNotifications: true,
        autoSaveInterval: 30,
        defaultEditorMode: 'rich',
        showLineNumbers: false,
        wordWrap: true,
        ...updateData,
      });
    } else {
      await this.settingsRepository.update(
        { userId },
        {
          ...updateData,
          updatedAt: new Date(),
        },
      );
      settings = await this.settingsRepository.findOne({
        where: { userId },
      });
    }

    return plainToClass(UserSettingsResponseDto, settings!);
  }
}
