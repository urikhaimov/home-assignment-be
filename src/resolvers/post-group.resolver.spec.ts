import { Test, TestingModule } from '@nestjs/testing';
import { PostGroupResolver } from './post-group.resolver';
import { PostGroupService } from '../services/post-group.service';
import {
  PostStatus,
  SocialPillar,
  SocialPlatform,
} from '../graphql/graphql.types';

describe('PostGroupResolver', () => {
  let resolver: PostGroupResolver;

  const mockPostGroupService = {
    findByStatusPaginated: jest.fn(),
    findById: jest.fn(),
    findAllPaginated: jest.fn(),
    getStats: jest.fn(),
    create: jest.fn(),
    approve: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostGroupResolver,
        {
          provide: PostGroupService,
          useValue: mockPostGroupService,
        },
      ],
    }).compile();

    resolver = module.get<PostGroupResolver>(PostGroupResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('postsPendingReview', () => {
    it('should return pending posts connection', async () => {
      const mockConnection = {
        edges: [
          {
            node: {
              id: '1',
              status: PostStatus.PENDING_REVIEW,
              posts: [],
            },
            cursor: 'cursor1',
          },
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'cursor1',
          endCursor: 'cursor1',
        },
        totalCount: 1,
      };

      mockPostGroupService.findByStatusPaginated.mockResolvedValue(
        mockConnection,
      );

      const result = await resolver.postsPendingReview();

      expect(mockPostGroupService.findByStatusPaginated).toHaveBeenCalledWith(
        PostStatus.PENDING_REVIEW,
        undefined,
      );
      expect(result).toEqual(mockConnection);
    });
  });

  describe('postGroupById', () => {
    it('should return a post group by id', async () => {
      const mockPost = {
        id: '1',
        content: 'Test content',
        posts: [],
      };

      mockPostGroupService.findById.mockResolvedValue(mockPost);

      const result = await resolver.postGroupById('1');

      expect(mockPostGroupService.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPost);
    });
  });

  describe('postStats', () => {
    it('should return post statistics', async () => {
      const mockStats = {
        planned: 2,
        pending: 2,
        scheduled: 5,
        published: 10,
      };

      mockPostGroupService.getStats.mockResolvedValue(mockStats);

      const result = await resolver.postStats();

      expect(mockPostGroupService.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('createPostGroup', () => {
    it('should create a new post group', async () => {
      const input = {
        content: 'Test content',
        mediaUrls: ['http://example.com/image.jpg'],
        pillar: SocialPillar.AUTHORITY,
        scheduledDate: '2024-12-31T12:00:00Z',
        posts: [
          {
            platform: SocialPlatform.FACEBOOK,
            caption: 'Facebook caption',
          },
        ],
      };

      const mockCreatedPost = {
        id: '1',
        ...input,
        status: PostStatus.PENDING_REVIEW,
        posts: [],
      };

      mockPostGroupService.create.mockResolvedValue(mockCreatedPost);

      const result = await resolver.createPostGroup(input);

      expect(mockPostGroupService.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockCreatedPost);
    });
  });

  describe('approvePostGroup', () => {
    it('should approve a post group', async () => {
      const mockApprovedPost = {
        id: '1',
        status: PostStatus.SCHEDULED,
        posts: [],
      };

      mockPostGroupService.approve.mockResolvedValue(mockApprovedPost);

      const result = await resolver.approvePostGroup('1');

      expect(mockPostGroupService.approve).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockApprovedPost);
    });
  });
});
