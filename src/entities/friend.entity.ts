import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export enum FriendStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  BLOCKED = 'blocked',
}

@Entity('friends')
@Unique('unique_friend_pair', ['requesterId', 'addresseeId'])
@Index(['requesterId', 'status'])
@Index(['addresseeId', 'status'])
export class Friend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column({ type: 'text' })
  addresseeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'addresseeId' })
  addressee: User;

  @Column({
    type: 'enum',
    enum: FriendStatus,
    default: FriendStatus.PENDING,
  })
  status: FriendStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
