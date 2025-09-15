import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Note } from './note.entity';
import { NoteRole } from './note-permission.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity('invitations')
@Index(['token'])
@Index(['noteId'])
@Index(['inviteeEmail'])
@Index(['status'])
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'text' })
  noteId: string;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column({ type: 'text' })
  inviterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inviterId' })
  inviter: User;

  @Column({ type: 'text' })
  inviteeEmail: string;

  @Column({ type: 'text', nullable: true })
  inviteeId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'inviteeId' })
  invitee: User | null;

  @Column({
    type: 'enum',
    enum: NoteRole,
  })
  role: NoteRole;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
