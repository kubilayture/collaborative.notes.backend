import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Note } from './note.entity';

@Entity('collab_snapshots')
@Index(['noteId', 'version'])
@Index(['createdAt'])
export class CollabSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  noteId: string;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column({ type: 'integer' })
  version: number;

  @Column({ type: 'bytea' })
  snapshot: Buffer;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
