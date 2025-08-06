import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { PostGroupService } from '../services/post-group.service';
import { PostGroup } from '../entities/post-group.entity';
import { Post } from '../entities/post.entity';
import {
  IQuery,
  IMutation,
  CreatePostGroupInput,
  PostStats,
  PostStatus,
  PaginationInput,
  PostGroupConnection,
  PostGroupFilters,
} from '../graphql/graphql.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Resolver('PostGroup')
export class PostGroupResolver implements IQuery, IMutation {
  constructor(
    private readonly postGroupService: PostGroupService,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  @Query()
  async postsPendingReview(
    @Args('pagination') pagination?: PaginationInput,
  ): Promise<PostGroupConnection> {
    return this.postGroupService.findByStatusPaginated(
      PostStatus.PENDING_REVIEW,
      pagination || undefined,
    );
  }

  @Query()
  async postGroupById(@Args('id') id: string): Promise<PostGroup | null> {
    return this.postGroupService.findById(id);
  }

  @Query()
  async allPostGroups(
    @Args('pagination') pagination?: PaginationInput,
    @Args('filters') filters?: PostGroupFilters,
  ): Promise<PostGroupConnection> {
    return this.postGroupService.findAllPaginated(
      pagination || undefined,
      filters || undefined,
    );
  }

  @Query()
  async postStats(): Promise<PostStats> {
    return this.postGroupService.getStats();
  }

  @Mutation()
  async createPostGroup(
    @Args('input') input: CreatePostGroupInput,
  ): Promise<PostGroup> {
    return this.postGroupService.create(input);
  }

  @Mutation()
  async approvePostGroup(@Args('id') id: string): Promise<PostGroup> {
    return this.postGroupService.approve(id);
  }

  @ResolveField('posts')
  async posts(@Parent() postGroup: PostGroup): Promise<Post[]> {
    return this.postRepository.find({
      where: { postGroupId: postGroup.id },
    });
  }
}
