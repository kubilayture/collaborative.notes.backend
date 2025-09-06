import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

/**
 * Read-only entity mapping to BetterAuth's user table.
 * DO NOT modify this table through TypeORM - BetterAuth manages it.
 */
@Entity('user')
export class User {
  @PrimaryColumn('text')
  id: string;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerified: Date | null;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Hide sensitive fields when serializing
  @Exclude()
  private?: any;
}