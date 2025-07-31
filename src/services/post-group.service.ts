import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PostGroup } from '../entities/post-group.entity';
import { Post } from '../entities/post.entity';
import {
  CreatePostGroupInput,
  PostStats,
  PostStatus,
  PostGroupConnection,
  PostGroupFilters,
} from '../graphql/graphql.types';
import { PaginationUtil, PaginationArgs } from '../utils/pagination.util';

@Injectable()
export class PostGroupService {
  constructor(
    @InjectRepository(PostGroup)
    private readonly postGroupRepository: Repository<PostGroup>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async findByStatus(status: PostStatus): Promise<PostGroup[]> {
    return this.postGroupRepository.find({
      where: { status },
      relations: ['posts'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatusPaginated(
    status: PostStatus,
    paginationArgs?: PaginationArgs,
  ): Promise<PostGroupConnection> {
    const args = paginationArgs || {};
    PaginationUtil.validatePaginationArgs(args);

    const queryBuilder = this.createBaseQueryBuilder();
    queryBuilder.where('postGroup.status = :status', { status });

    return this.executePaginatedQuery(queryBuilder, args);
  }

  async findAllPaginated(
    paginationArgs?: PaginationArgs,
    filters?: PostGroupFilters | null,
  ): Promise<PostGroupConnection> {
    const args = paginationArgs || {};
    PaginationUtil.validatePaginationArgs(args);

    const queryBuilder = this.createBaseQueryBuilder();
    this.applyFilters(queryBuilder, filters);

    return this.executePaginatedQuery(queryBuilder, args);
  }

  async findById(id: string): Promise<PostGroup | null> {
    const postGroup = await this.postGroupRepository.findOne({
      where: { id },
      relations: ['posts'],
    });

    return postGroup || null;
  }

  async findAll(): Promise<PostGroup[]> {
    return this.postGroupRepository.find({
      relations: ['posts'],
      order: { createdAt: 'DESC' },
    });
  }

  private createBaseQueryBuilder(): SelectQueryBuilder<PostGroup> {
    return this.postGroupRepository
      .createQueryBuilder('postGroup')
      .leftJoinAndSelect('postGroup.posts', 'posts')
      .orderBy('postGroup.createdAt', 'DESC')
      .addOrderBy('postGroup.id', 'ASC'); // Secondary sort for stable pagination
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<PostGroup>,
    filters?: PostGroupFilters | null,
  ): void {
    if (!filters) {
      return;
    }

    // Multiple statuses filter (takes precedence over single status)
    if (filters.statuses && filters.statuses.length > 0) {
      queryBuilder.andWhere('postGroup.status IN (:...statuses)', {
        statuses: filters.statuses,
      });
    } else if (filters.status) {
      // Single status filter (only if multiple statuses not provided)
      queryBuilder.andWhere('postGroup.status = :status', {
        status: filters.status,
      });
    }

    // Multiple pillars filter (takes precedence over single pillar)
    if (filters.pillars && filters.pillars.length > 0) {
      queryBuilder.andWhere('postGroup.pillar IN (:...pillars)', {
        pillars: filters.pillars,
      });
    } else if (filters.pillar) {
      // Single pillar filter (only if multiple pillars not provided)
      queryBuilder.andWhere('postGroup.pillar = :pillar', {
        pillar: filters.pillar,
      });
    }
  }

  private async executePaginatedQuery(
    queryBuilder: SelectQueryBuilder<PostGroup>,
    args: PaginationArgs,
  ): Promise<PostGroupConnection> {
    const { first, last, after, before } = args;

    // Apply cursor filtering
    if (after) {
      const { createdAt, id } = PaginationUtil.decodeCursor(after);
      queryBuilder.andWhere(
        '(postGroup.createdAt < :afterDate OR (postGroup.createdAt = :afterDate AND postGroup.id > :afterId))',
        { afterDate: createdAt, afterId: id },
      );
    }

    if (before) {
      const { createdAt, id } = PaginationUtil.decodeCursor(before);
      queryBuilder.andWhere(
        '(postGroup.createdAt > :beforeDate OR (postGroup.createdAt = :beforeDate AND postGroup.id < :beforeId))',
        { beforeDate: createdAt, beforeId: id },
      );
    }

    // Apply limit
    const limit = PaginationUtil.getPageSize(args);
    queryBuilder.limit(limit + 1); // Request one extra to determine hasNextPage

    // Get total count (for pagination info)
    const totalCount = await queryBuilder.getCount();

    // Execute query
    const postGroups = await queryBuilder.getMany();

    // Determine if we have more results
    const hasMore = postGroups.length > limit;
    if (hasMore) {
      postGroups.pop(); // Remove the extra item
    }

    // Handle backward pagination (reverse order)
    if (last && !first) {
      postGroups.reverse();
    }

    return PaginationUtil.buildPostGroupConnection(
      postGroups,
      totalCount,
      args,
    );
  }

  async getStats(): Promise<PostStats> {
    const [pending, scheduled, published] = await Promise.all([
      this.postGroupRepository.count({
        where: { status: PostStatus.PENDING_REVIEW },
      }),
      this.postGroupRepository.count({
        where: { status: PostStatus.SCHEDULED },
      }),
      this.postGroupRepository.count({
        where: { status: PostStatus.PUBLISHED },
      }),
    ]);

    // For now, planned is the same as pending - could be extended for draft status
    const planned = pending;

    return {
      planned,
      pending,
      scheduled,
      published,
    };
  }

  async create(input: CreatePostGroupInput): Promise<PostGroup> {
    const postGroup = this.postGroupRepository.create({
      content: input.content,
      mediaUrls: input.mediaUrls,
      pillar: input.pillar,
      scheduledDate: new Date(input.scheduledDate),
      status: PostStatus.PENDING_REVIEW,
    });

    const savedPostGroup = await this.postGroupRepository.save(postGroup);

    // Create posts for each platform
    const posts = input.posts.map((postInput) =>
      this.postRepository.create({
        platform: postInput.platform,
        caption: postInput.caption,
        postGroupId: savedPostGroup.id,
      }),
    );

    await this.postRepository.save(posts);

    // Return the complete post group with posts
    const result = await this.findById(savedPostGroup.id);
    if (!result) {
      throw new Error('Failed to retrieve created post group');
    }
    return result;
  }

  async approve(id: string): Promise<PostGroup> {
    const postGroup = await this.findById(id);
    if (!postGroup) {
      throw new NotFoundException(`PostGroup with ID ${id} not found`);
    }

    const now = new Date();
    const scheduledDate = new Date(postGroup.scheduledDate);

    // If scheduled date is in the past, publish immediately
    if (scheduledDate <= now) {
      postGroup.status = PostStatus.PUBLISHED;
      postGroup.publishedDate = now;
    } else {
      postGroup.status = PostStatus.SCHEDULED;
    }

    await this.postGroupRepository.save(postGroup);
    return postGroup;
  }
}
