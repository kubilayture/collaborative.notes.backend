import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', nullable: true, default: 'system' })
  theme: string | null;

  @Column({ type: 'text', nullable: true, default: 'en' })
  language: string | null;

  @Column({ type: 'boolean', default: true })
  emailNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  pushNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  desktopNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  soundNotifications: boolean;

  @Column({ type: 'integer', default: 30 })
  autoSaveInterval: number;

  @Column({ type: 'text', default: 'rich' })
  defaultEditorMode: string;

  @Column({ type: 'boolean', default: false })
  showLineNumbers: boolean;

  @Column({ type: 'boolean', default: true })
  wordWrap: boolean;

  @Column({ type: 'jsonb', nullable: true })
  additionalSettings: Record<string, any> | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}