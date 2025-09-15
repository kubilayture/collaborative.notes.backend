import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

/**
 * Read-only entity mapping to BetterAuth's user table.
 * DO NOT modify this table through TypeORM - BetterAuth manages it.
 */
@Entity('user')
export class User {
  @PrimaryColumn('text')
  id: string;

  // DB: name text NOT NULL
  @Column({ type: 'text' })
  name: string;

  // DB: email text NOT NULL UNIQUE
  @Column({ type: 'text', unique: true })
  email: string;

  // DB: emailVerified boolean NOT NULL
  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  // DB: image text (NULL allowed)
  @Column({ type: 'text', nullable: true })
  image: string | null;

  // DB: createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  @CreateDateColumn({
    type: 'timestamp',
    name: 'createdAt',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // DB: updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updatedAt',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Exclude()
  private?: any;
}
