import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Note } from './note.entity';

export enum ActivityType {
  NOTE_CREATED = 'note_created',
  NOTE_UPDATED = 'note_updated',
  NOTE_SHARED = 'note_shared',
  NOTE_PERMISSION_CHANGED = 'note_permission_changed',
  NOTE_COLLABORATOR_JOINED = 'note_collaborator_joined',
  NOTE_COLLABORATOR_LEFT = 'note_collaborator_left',
  NOTE_COMMENT_ADDED = 'note_comment_added',
  NOTE_VERSION_RESTORED = 'note_version_restored',
}

@Entity('activity')
@Index(['noteId', 'createdAt'])
@Index(['userId'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  noteId: string;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column({ type: 'text' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
