import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';

@Entity('folders')
@Index(['ownerId'])
@Index(['parentId'])
@Index(['ownerId', 'parentId'])
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 7, nullable: true })
  color?: string;

  @Column()
  ownerId: string;

  @Column({ nullable: true })
  parentId?: string;

  @Column({ default: false })
  isSystem: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Folder, folder => folder.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent?: Folder;

  @OneToMany(() => Folder, folder => folder.parent)
  children: Folder[];
}