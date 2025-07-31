import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostGroupService } from './post-group.service';
import { PostGroup } from '../entities/post-group.entity';
import { Post } from '../entities/post.entity';
import { PostStatus, SocialPillar } from '../graphql/graphql.types';
import { NotFoundException } from '@nestjs/common';

describe('PostGroupService', () => {
  let service: PostGroupService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getMany: jest.fn(),
  };

  const mockPostGroupRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockPostRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostGroupService,
        {
          provide: getRepositoryToken(PostGroup),
          useValue: mockPostGroupRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
      ],
    }).compile();

    service = module.get<PostGroupService>(PostGroupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByStatus', () => {
    it('should return posts with given status', async () => {
      const mockPostGroups = [
        {
          id: '1',
          status: PostStatus.PENDING_REVIEW,
          posts: [],
        },
      ];

      mockPostGroupRepository.find.mockResolvedValue(mockPostGroups);

      const result = await service.findByStatus(PostStatus.PENDING_REVIEW);

      expect(mockPostGroupRepository.find).toHaveBeenCalledWith({
        where: { status: PostStatus.PENDING_REVIEW },
        relations: ['posts'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockPostGroups);
    });
  });

  describe('findById', () => {
    it('should return a post group by id', async () => {
      const mockPostGroup = {
        id: '1',
        content: 'Test content',
        posts: [],
      };

      mockPostGroupRepository.findOne.mockResolvedValue(mockPostGroup);

      const result = await service.findById('1');

      expect(mockPostGroupRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['posts'],
      });
      expect(result).toEqual(mockPostGroup);
    });

    it('should return null if post group not found', async () => {
      mockPostGroupRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return post statistics', async () => {
      mockPostGroupRepository.count
        .mockResolvedValueOnce(2) // pending
        .mockResolvedValueOnce(5) // scheduled
        .mockResolvedValueOnce(10); // published

      const result = await service.getStats();

      expect(result).toEqual({
        planned: 2,
        pending: 2,
        scheduled: 5,
        published: 10,
      });
    });
  });

  describe('approve', () => {
    it('should approve a post group and set to scheduled if future date', async () => {
      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      const mockPostGroup = {
        id: '1',
        status: PostStatus.PENDING_REVIEW,
        scheduledDate: futureDate,
        posts: [],
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockPostGroup as any);
      mockPostGroupRepository.save.mockResolvedValue({
        ...mockPostGroup,
        status: PostStatus.SCHEDULED,
      });

      await service.approve('1');

      expect(mockPostGroup.status).toBe(PostStatus.SCHEDULED);
      expect(mockPostGroupRepository.save).toHaveBeenCalledWith(mockPostGroup);
    });

    it('should approve a post group and set to published if past date', async () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday
      const mockPostGroup = {
        id: '1',
        status: PostStatus.PENDING_REVIEW,
        scheduledDate: pastDate,
        publishedDate: undefined,
        posts: [],
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockPostGroup as any);
      mockPostGroupRepository.save.mockResolvedValue({
        ...mockPostGroup,
        status: PostStatus.PUBLISHED,
      });

      await service.approve('1');

      expect(mockPostGroup.status).toBe(PostStatus.PUBLISHED);
      expect(mockPostGroup.publishedDate).toBeDefined();
      expect(mockPostGroupRepository.save).toHaveBeenCalledWith(mockPostGroup);
    });

    it('should throw NotFoundException if post group not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      await expect(service.approve('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllPaginated with filters', () => {
    beforeEach(() => {
      mockQueryBuilder.getCount.mockResolvedValue(5);
      mockQueryBuilder.getMany.mockResolvedValue([
        {
          id: '1',
          status: PostStatus.SCHEDULED,
          pillar: SocialPillar.EDUCATION,
          createdAt: new Date('2023-01-01'),
          posts: [],
        },
        {
          id: '2',
          status: PostStatus.PUBLISHED,
          pillar: SocialPillar.ENTERTAINMENT,
          createdAt: new Date('2023-01-02'),
          posts: [],
        },
      ]);
    });

    it('should filter by single status', async () => {
      const filters = { status: PostStatus.SCHEDULED };

      await service.findAllPaginated({}, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'postGroup.status = :status',
        { status: PostStatus.SCHEDULED },
      );
    });

    it('should filter by multiple statuses', async () => {
      const filters = {
        statuses: [PostStatus.SCHEDULED, PostStatus.PUBLISHED],
      };

      await service.findAllPaginated({}, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'postGroup.status IN (:...statuses)',
        { statuses: [PostStatus.SCHEDULED, PostStatus.PUBLISHED] },
      );
    });

    it('should filter by single pillar', async () => {
      const filters = { pillar: SocialPillar.EDUCATION };

      await service.findAllPaginated({}, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'postGroup.pillar = :pillar',
        { pillar: SocialPillar.EDUCATION },
      );
    });

    it('should filter by multiple pillars', async () => {
      const filters = {
        pillars: [SocialPillar.EDUCATION, SocialPillar.ENTERTAINMENT],
      };

      await service.findAllPaginated({}, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'postGroup.pillar IN (:...pillars)',
        { pillars: [SocialPillar.EDUCATION, SocialPillar.ENTERTAINMENT] },
      );
    });

    it('should handle no filters', async () => {
      await service.findAllPaginated({}, undefined);

      // Should not call andWhere for filters
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should prefer multiple statuses over single status', async () => {
      const filters = {
        status: PostStatus.PENDING_REVIEW,
        statuses: [PostStatus.SCHEDULED, PostStatus.PUBLISHED],
      };

      await service.findAllPaginated({}, filters);

      // Should use the statuses array, not single status
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'postGroup.status IN (:...statuses)',
        { statuses: [PostStatus.SCHEDULED, PostStatus.PUBLISHED] },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'postGroup.status = :status',
        expect.anything(),
      );
    });
  });
});
