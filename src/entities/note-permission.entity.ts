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
import { Note } from './note.entity';

export enum NoteRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  COMMENTER = 'commenter',
  VIEWER = 'viewer',
}

@Entity('note_permissions')
@Unique('unique_note_user_permission', ['noteId', 'userId'])
@Index(['noteId'])
@Index(['userId'])
export class NotePermission {
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
    enum: NoteRole,
  })
  role: NoteRole;

  @Column({ type: 'text', nullable: true })
  grantedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'grantedById' })
  grantedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}