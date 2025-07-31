import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Post } from './post.entity';
import { SocialPillar, PostStatus } from '../graphql/graphql.types';

@Entity('post_groups')
export class PostGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 3000 })
  content: string;

  @Column('text', { array: true })
  mediaUrls: string[];

  @Column({
    type: 'enum',
    enum: SocialPillar,
  })
  pillar: SocialPillar;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.PENDING_REVIEW,
  })
  status: PostStatus;

  @Column({ type: 'timestamptz' })
  scheduledDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishedDate?: Date;

  @OneToMany(() => Post, (post) => post.postGroup, { cascade: true })
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
