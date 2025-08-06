import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { PostGroup } from '../src/entities/post-group.entity';
import { Post } from '../src/entities/post.entity';
import {
  PostGroupConnection,
  PostStatus,
  SocialPillar,
  SocialPlatform,
  PostStats,
} from '../src/graphql/graphql.types';

// Test response types
interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface AllPostGroupsResponse {
  allPostGroups: PostGroupConnection;
}

interface PostsPendingReviewResponse {
  postsPendingReview: PostGroupConnection;
}

interface CreatePostGroupResponse {
  createPostGroup: PostGroup;
}

interface ApprovePostGroupResponse {
  approvePostGroup: PostGroup;
}

interface PostStatsResponse {
  postStats: PostStats;
}

// Helper function to safely extract GraphQL response data
function getGraphQLData<T>(response: request.Response): T {
  const body = response.body as GraphQLResponse<T>;
  if (body.errors) {
    throw new Error(`GraphQL Error: ${body.errors[0].message}`);
  }
  return body.data!;
}

function getGraphQLErrors(response: request.Response): string[] {
  const body = response.body as GraphQLResponse<unknown>;
  return body.errors?.map((e) => e.message) || [];
}

describe('PostGroup Integration (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test - use repositories with where condition
    // Delete all posts first (child records)
    const posts = await dataSource.getRepository(Post).find();
    if (posts.length > 0) {
      await dataSource.getRepository(Post).remove(posts);
    }

    // Delete all post groups (parent records)
    const postGroups = await dataSource.getRepository(PostGroup).find();
    if (postGroups.length > 0) {
      await dataSource.getRepository(PostGroup).remove(postGroups);
    }
  });

  describe('allPostGroups Query', () => {
    beforeEach(async () => {
      // Create test data
      const postGroups: PostGroup[] = [];
      for (let i = 0; i < 25; i++) {
        const postGroup = dataSource.getRepository(PostGroup).create({
          content: `Test content ${i}`,
          mediaUrls: [`https://picsum.photos/id/${100 + i}/800/600`],
          pillar: SocialPillar.AUTHORITY,
          status: PostStatus.PENDING_REVIEW,
          scheduledDate: new Date('2024-12-31'),
        });
        postGroups.push(
          await dataSource.getRepository(PostGroup).save(postGroup),
        );
      }

      // Create posts for each post group
      for (const postGroup of postGroups) {
        const post = dataSource.getRepository(Post).create({
          platform: SocialPlatform.FACEBOOK,
          caption: `Caption for ${postGroup.content}`,
          postGroupId: postGroup.id,
        });
        await dataSource.getRepository(Post).save(post);
      }
    });

    it('should return first 10 items with correct pagination info', async () => {
      const query = `
        query {
          allPostGroups(pagination: { first: 10 }) {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            edges {
              node {
                id
                content
                posts {
                  id
                  platform
                }
              }
              cursor
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const responseData = getGraphQLData<AllPostGroupsResponse>(response);
      const data = responseData.allPostGroups;

      expect(data.totalCount).toBe(25);
      expect(data.edges).toHaveLength(10);
      expect(data.pageInfo.hasNextPage).toBe(true);
      expect(data.pageInfo.hasPreviousPage).toBe(false);
      expect(data.pageInfo.startCursor).toBeDefined();
      expect(data.pageInfo.endCursor).toBeDefined();

      // Verify cursor format (should be base64 encoded numbers)
      const startCursor = Buffer.from(
        data.pageInfo.startCursor || '',
        'base64',
      ).toString();
      const endCursor = Buffer.from(
        data.pageInfo.endCursor || '',
        'base64',
      ).toString();
      expect(startCursor).toBe('1');
      expect(endCursor).toBe('10');

      // Verify posts are loaded via field resolver
      expect(data.edges[0].node.posts).toHaveLength(1);
      expect(data.edges[0].node.posts[0].platform).toBe(
        SocialPlatform.FACEBOOK,
      );
    });

    it('should handle forward pagination correctly', async () => {
      // First, get the first page
      const firstPageQuery = `
        query {
          allPostGroups(pagination: { first: 10 }) {
            pageInfo { endCursor }
            edges { node { id } }
          }
        }
      `;

      const firstResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: firstPageQuery })
        .expect(200);

      const firstData = getGraphQLData<AllPostGroupsResponse>(firstResponse);
      const endCursor = firstData.allPostGroups.pageInfo.endCursor;

      // Now get the second page
      const secondPageQuery = `
        query {
          allPostGroups(pagination: { first: 10, after: "${endCursor}" }) {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            edges {
              node { id }
              cursor
            }
          }
        }
      `;

      const secondResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: secondPageQuery })
        .expect(200);

      const secondResponseData =
        getGraphQLData<AllPostGroupsResponse>(secondResponse);
      const secondData = secondResponseData.allPostGroups;

      expect(secondData.totalCount).toBe(25);
      expect(secondData.edges).toHaveLength(10);
      expect(secondData.pageInfo.hasNextPage).toBe(true);
      expect(secondData.pageInfo.hasPreviousPage).toBe(true);

      // Verify cursor progression
      const startCursor = Buffer.from(
        secondData.pageInfo.startCursor!,
        'base64',
      ).toString();
      const newEndCursor = Buffer.from(
        secondData.pageInfo.endCursor!,
        'base64',
      ).toString();
      expect(startCursor).toBe('11');
      expect(newEndCursor).toBe('20');

      // Verify no overlap with first page
      const firstPageIds = firstData.allPostGroups.edges.map((e) => e.node.id);
      const secondPageIds = secondData.edges.map((e) => e.node.id);
      const hasOverlap = firstPageIds.some((id: string) =>
        secondPageIds.includes(id),
      );
      expect(hasOverlap).toBe(false);
    });

    it('should handle backward pagination correctly', async () => {
      // Create a cursor for position 20 (to get last 10 items before it)
      const beforeCursor = Buffer.from('20').toString('base64');

      const query = `
        query {
          allPostGroups(pagination: { last: 10, before: "${beforeCursor}" }) {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            edges {
              node { id }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const data = getGraphQLData<AllPostGroupsResponse>(response);
      const allPostGroups = data.allPostGroups;

      expect(allPostGroups.totalCount).toBe(25);
      expect(allPostGroups.edges).toHaveLength(10);
      expect(allPostGroups.pageInfo.hasNextPage).toBe(true);
      expect(allPostGroups.pageInfo.hasPreviousPage).toBe(true);

      // Verify cursors for backward pagination
      const startCursor = Buffer.from(
        allPostGroups.pageInfo.startCursor!,
        'base64',
      ).toString();
      const endCursor = Buffer.from(
        allPostGroups.pageInfo.endCursor!,
        'base64',
      ).toString();
      expect(startCursor).toBe('10');
      expect(endCursor).toBe('19');
    });

    it('should handle last page correctly', async () => {
      // Get the last 5 items
      const query = `
        query {
          allPostGroups(pagination: { last: 5 }) {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges {
              node { id }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const data = getGraphQLData<AllPostGroupsResponse>(response);
      const allPostGroups = data.allPostGroups;

      expect(allPostGroups.totalCount).toBe(25);
      expect(allPostGroups.edges).toHaveLength(5); // All items
      expect(allPostGroups.pageInfo.hasNextPage).toBe(false);
      expect(allPostGroups.pageInfo.hasPreviousPage).toBe(true);
    });

    it('should handle empty results correctly', async () => {
      // Clear all data
      const posts = await dataSource.getRepository(Post).find();
      if (posts.length > 0) {
        await dataSource.getRepository(Post).remove(posts);
      }

      const postGroups = await dataSource.getRepository(PostGroup).find();
      if (postGroups.length > 0) {
        await dataSource.getRepository(PostGroup).remove(postGroups);
      }

      const query = `
        query {
          allPostGroups(pagination: { first: 10 }) {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            edges {
              node { id }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const data = getGraphQLData<AllPostGroupsResponse>(response);
      const allPostGroups = data.allPostGroups;

      expect(allPostGroups.totalCount).toBe(0);
      expect(allPostGroups.edges).toHaveLength(0);
      expect(allPostGroups.pageInfo.hasNextPage).toBe(false);
      expect(allPostGroups.pageInfo.hasPreviousPage).toBe(false);
      expect(allPostGroups.pageInfo.startCursor).toBeNull();
      expect(allPostGroups.pageInfo.endCursor).toBeNull();
    });
  });

  describe('postsPendingReview Query', () => {
    beforeEach(async () => {
      // Create mixed status test data
      const statuses = [
        PostStatus.PENDING_REVIEW,
        PostStatus.SCHEDULED,
        PostStatus.PUBLISHED,
        PostStatus.PENDING_REVIEW,
        PostStatus.PENDING_REVIEW,
        PostStatus.SCHEDULED,
      ];

      for (let i = 0; i < statuses.length; i++) {
        const postGroup = dataSource.getRepository(PostGroup).create({
          content: `Test content ${i}`,
          mediaUrls: [`https://picsum.photos/id/${100 + i}/800/600`],
          pillar: SocialPillar.AUTHORITY,
          status: statuses[i],
          scheduledDate: new Date('2024-12-31'),
        });
        await dataSource.getRepository(PostGroup).save(postGroup);
      }
    });

    it('should return only pending review posts', async () => {
      const query = `
        query {
          postsPendingReview(pagination: { first: 10 }) {
            totalCount
            edges {
              node {
                id
                status
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const data = getGraphQLData<PostsPendingReviewResponse>(response);
      const postsPendingReview = data.postsPendingReview;

      expect(postsPendingReview.totalCount).toBe(3); // Only 3 PENDING_REVIEW items
      expect(postsPendingReview.edges).toHaveLength(3);

      // All returned items should be PENDING_REVIEW
      postsPendingReview.edges.forEach((edge) => {
        expect(edge.node.status).toBe(PostStatus.PENDING_REVIEW);
      });
    });
  });

  describe('Filtered Queries', () => {
    beforeEach(async () => {
      // Create test data with different pillars and statuses
      const testData = [
        { pillar: SocialPillar.AUTHORITY, status: PostStatus.PENDING_REVIEW },
        { pillar: SocialPillar.COMMUNITY, status: PostStatus.PENDING_REVIEW },
        { pillar: SocialPillar.AUTHORITY, status: PostStatus.SCHEDULED },
        { pillar: SocialPillar.EDUCATION, status: PostStatus.PUBLISHED },
        { pillar: SocialPillar.AUTHORITY, status: PostStatus.PUBLISHED },
      ];

      for (let i = 0; i < testData.length; i++) {
        const postGroup = dataSource.getRepository(PostGroup).create({
          content: `Test content ${i}`,
          mediaUrls: [`https://picsum.photos/id/${100 + i}/800/600`],
          pillar: testData[i].pillar,
          status: testData[i].status,
          scheduledDate: new Date('2024-12-31'),
        });
        await dataSource.getRepository(PostGroup).save(postGroup);
      }
    });

    it('should filter by single pillar', async () => {
      const query = `
        query {
          allPostGroups(
            pagination: { first: 10 }
            filters: { pillar: AUTHORITY }
          ) {
            totalCount
            edges {
              node {
                pillar
                status
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const data = getGraphQLData<AllPostGroupsResponse>(response);
      const allPostGroups = data.allPostGroups;

      expect(allPostGroups.totalCount).toBe(3); // 3 AUTHORITY items
      allPostGroups.edges.forEach((edge) => {
        expect(edge.node.pillar).toBe(SocialPillar.AUTHORITY);
      });
    });

    it('should filter by multiple statuses', async () => {
      const query = `
        query {
          allPostGroups(
            pagination: { first: 10 }
            filters: { statuses: [PENDING_REVIEW, SCHEDULED] }
          ) {
            totalCount
            edges {
              node {
                status
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const data = getGraphQLData<AllPostGroupsResponse>(response);
      const allPostGroups = data.allPostGroups;

      expect(allPostGroups.totalCount).toBe(3); // 2 PENDING_REVIEW + 1 SCHEDULED
      allPostGroups.edges.forEach((edge) => {
        expect([PostStatus.PENDING_REVIEW, PostStatus.SCHEDULED]).toContain(
          edge.node.status,
        );
      });
    });
  });

  describe('Mutations', () => {
    it('should create a new post group', async () => {
      const mutation = `
        mutation {
          createPostGroup(input: {
            content: "Test post group content"
            mediaUrls: ["https://picsum.photos/id/100/800/600"]
            pillar: AUTHORITY
            scheduledDate: "2024-12-31T12:00:00Z"
            posts: [
              {
                platform: FACEBOOK
                caption: "Facebook caption"
              }
              {
                platform: INSTAGRAM
                caption: "Instagram caption"
              }
            ]
          }) {
            id
            content
            status
            pillar
            posts {
              id
              platform
              caption
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      const data = getGraphQLData<CreatePostGroupResponse>(response);
      const createPostGroup = data.createPostGroup;

      expect(createPostGroup.id).toBeDefined();
      expect(createPostGroup.content).toBe('Test post group content');
      expect(createPostGroup.status).toBe(PostStatus.PENDING_REVIEW);
      expect(createPostGroup.pillar).toBe(SocialPillar.AUTHORITY);
      expect(createPostGroup.posts).toHaveLength(2);

      // Verify posts were created correctly
      const platforms = createPostGroup.posts.map((p) => p.platform);
      expect(platforms).toContain(SocialPlatform.FACEBOOK);
      expect(platforms).toContain(SocialPlatform.INSTAGRAM);
    });

    it('should approve a post group and set correct status', async () => {
      // First create a post group
      const postGroup = dataSource.getRepository(PostGroup).create({
        content: 'Test content for approval',
        mediaUrls: ['https://picsum.photos/id/100/800/600'],
        pillar: SocialPillar.AUTHORITY,
        status: PostStatus.PENDING_REVIEW,
        scheduledDate: new Date('2025-12-31'), // Future date
      });
      const savedPostGroup = await dataSource
        .getRepository(PostGroup)
        .save(postGroup);

      const mutation = `
        mutation {
          approvePostGroup(id: "${savedPostGroup.id}") {
            id
            status
            publishedDate
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      const data = getGraphQLData<ApprovePostGroupResponse>(response);
      const approvePostGroup = data.approvePostGroup;

      expect(approvePostGroup.id).toBe(savedPostGroup.id);
      expect(approvePostGroup.status).toBe(PostStatus.SCHEDULED); // Future date = SCHEDULED
      expect(approvePostGroup.publishedDate).toBeNull();
    });

    it('should approve and immediately publish past-scheduled post group', async () => {
      // Create a post group with past scheduled date
      const postGroup = dataSource.getRepository(PostGroup).create({
        content: 'Test content for immediate publish',
        mediaUrls: ['https://picsum.photos/id/100/800/600'],
        pillar: SocialPillar.AUTHORITY,
        status: PostStatus.PENDING_REVIEW,
        scheduledDate: new Date('2020-01-01'), // Past date
      });
      const savedPostGroup = await dataSource
        .getRepository(PostGroup)
        .save(postGroup);

      const mutation = `
        mutation {
          approvePostGroup(id: "${savedPostGroup.id}") {
            id
            status
            publishedDate
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      const data = getGraphQLData<ApprovePostGroupResponse>(response);
      const approvePostGroup = data.approvePostGroup;

      expect(approvePostGroup.id).toBe(savedPostGroup.id);
      expect(approvePostGroup.status).toBe(PostStatus.PUBLISHED); // Past date = PUBLISHED
      expect(approvePostGroup.publishedDate).toBeDefined();
    });
  });

  describe('Stats Query', () => {
    beforeEach(async () => {
      const testData = [
        PostStatus.PENDING_REVIEW,
        PostStatus.PENDING_REVIEW,
        PostStatus.SCHEDULED,
        PostStatus.SCHEDULED,
        PostStatus.SCHEDULED,
        PostStatus.PUBLISHED,
        PostStatus.PUBLISHED,
        PostStatus.PUBLISHED,
        PostStatus.PUBLISHED,
      ];

      for (let i = 0; i < testData.length; i++) {
        const postGroup = dataSource.getRepository(PostGroup).create({
          content: `Test content ${i}`,
          mediaUrls: [`https://picsum.photos/id/${100 + i}/800/600`],
          pillar: SocialPillar.AUTHORITY,
          status: testData[i],
          scheduledDate: new Date('2024-12-31'),
        });
        await dataSource.getRepository(PostGroup).save(postGroup);
      }
    });

    it('should return correct statistics', async () => {
      const query = `
        query {
          postStats {
            planned
            pending
            scheduled
            published
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const data = getGraphQLData<PostStatsResponse>(response);
      const postStats = data.postStats;

      expect(postStats.pending).toBe(2);
      expect(postStats.scheduled).toBe(3);
      expect(postStats.published).toBe(4);
      expect(postStats.planned).toBe(2); // Same as pending for now
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid pagination parameters', async () => {
      const query = `
        query {
          allPostGroups(pagination: { first: 10, last: 10 }) {
            totalCount
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      const errors = getGraphQLErrors(response);

      expect(errors).toBeDefined();
      expect(errors[0]).toContain('Invalid paging parameters');
    });

    it('should handle non-existent post group approval', async () => {
      // Use a valid UUID format but non-existent ID
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const mutation = `
        mutation {
          approvePostGroup(id: "${nonExistentId}") {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      const errors = getGraphQLErrors(response);

      expect(errors).toBeDefined();
      expect(errors[0]).toContain('not found');
    });
  });
});
