import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ) {
    const entity = this.notificationRepo.create({
      userId,
      type,
      title,
      message,
      data: data || null,
    });
    const saved = await this.notificationRepo.save(entity);

    // Emit real-time event and counts
    this.gateway.emitToUser(userId, 'notification:new', this.serialize(saved));
    const counts = await this.getUnreadCounts(userId);
    this.gateway.emitToUser(userId, 'notification:counts', counts);

    return this.serialize(saved);
  }

  async markRead(userId: string, id: string) {
    const notif = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notif) return;
    if (!notif.isRead) {
      notif.isRead = true;
      notif.readAt = new Date();
      await this.notificationRepo.save(notif);
      const counts = await this.getUnreadCounts(userId);
      this.gateway.emitToUser(userId, 'notification:counts', counts);
    }
  }

  async markAllRead(userId: string, type?: NotificationType) {
    const qb = this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: () => 'now()' })
      .where('"userId" = :userId AND "isRead" = false', { userId });
    if (type) qb.andWhere('type = :type', { type });
    await qb.execute();
    const counts = await this.getUnreadCounts(userId);
    this.gateway.emitToUser(userId, 'notification:counts', counts);
  }

  async markThreadMessagesRead(userId: string, threadId: string) {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: () => 'now()' })
      .where('"userId" = :userId AND "isRead" = false', { userId })
      .andWhere('type = :type', { type: NotificationType.NEW_MESSAGE })
      .andWhere("(data ->> 'threadId') = :threadId", { threadId })
      .execute();
    const counts = await this.getUnreadCounts(userId);
    this.gateway.emitToUser(userId, 'notification:counts', counts);
  }

  async list(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: items.map(this.serialize), total, page, limit };
  }

  async getUnreadCounts(userId: string) {
    const rows = await this.notificationRepo
      .createQueryBuilder('n')
      .select('n.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('n.userId = :userId AND n.isRead = false', { userId })
      .groupBy('n.type')
      .getRawMany<{ type: NotificationType; count: string }>();

    const countsMap: Record<string, number> = {};
    for (const r of rows) countsMap[r.type] = Number(r.count);

    return {
      invitations: countsMap[NotificationType.NOTE_INVITATION] || 0,
      messages: countsMap[NotificationType.NEW_MESSAGE] || 0,
      friends:
        (countsMap[NotificationType.FRIEND_REQUEST] || 0) +
        (countsMap[NotificationType.FRIEND_ACCEPTED] || 0),
      byType: countsMap,
    } as const;
  }

  private serialize = (n: Notification) => ({
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    data: n.data,
    isRead: n.isRead,
    readAt: n.readAt,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  });
}
