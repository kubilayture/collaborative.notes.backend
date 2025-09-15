import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../entities';

@Injectable()
export class PresenceService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async setUserOnline(userId: string): Promise<void> {
    await this.profileRepository.upsert(
      {
        userId,
        isOnline: true,
        lastSeenAt: new Date(),
      },
      ['userId'],
    );
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.profileRepository.update(
      { userId },
      {
        isOnline: false,
        lastSeenAt: new Date(),
      },
    );
  }

  async updateLastSeen(userId: string): Promise<void> {
    await this.profileRepository.update({ userId }, { lastSeenAt: new Date() });
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    return profile?.isOnline || false;
  }

  async getOnlineFriends(userIds: string[]): Promise<string[]> {
    const profiles = await this.profileRepository.find({
      where: { userId: userIds as unknown as string, isOnline: true },
      select: ['userId'],
    });

    return profiles.map((profile) => profile.userId);
  }
}
