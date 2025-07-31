import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostGroup } from './post-group.entity';
import { SocialPlatform } from '../graphql/graphql.types';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SocialPlatform,
  })
  platform: SocialPlatform;

  @Column({ type: 'varchar', length: 3000 })
  caption: string;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  comments: number;

  @Column({ type: 'int', default: 0 })
  shares: number;

  @ManyToOne(() => PostGroup, (postGroup) => postGroup.posts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_group_id' })
  postGroup: PostGroup;

  @Column({ name: 'post_group_id' })
  postGroupId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
