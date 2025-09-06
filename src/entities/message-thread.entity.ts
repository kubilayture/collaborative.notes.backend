import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('message_threads')
@Unique('unique_thread_participants', ['participant1Id', 'participant2Id'])
@Index(['participant1Id'])
@Index(['participant2Id'])
export class MessageThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  participant1Id: string;

  @Column({ type: 'text' })
  participant2Id: string;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastMessagePreview: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}