# GraphQL API Reference

## Queries

### `getPostsPendingReview`
Returns all post groups that are pending review.

**Returns:** `[PostGroup!]!`

**Example:**
```graphql
query {
  getPostsPendingReview {
    id
    content
    mediaUrls
    pillar
    status
    scheduledDate
    posts {
      id
      platform
      caption
    }
  }
}
```

### `getPostGroupById(id: ID!)`
Returns a specific post group by ID.

**Arguments:**
- `id: ID!` - The post group ID

**Returns:** `PostGroup`

**Example:**
```graphql
query GetPost($id: ID!) {
  getPostGroupById(id: $id) {
    id
    content
    status
    scheduledDate
    publishedDate
    posts {
      platform
      caption
      likes
      comments
      shares
    }
  }
}
```

### `getAllPostGroups`
Returns all post groups.

**Returns:** `[PostGroup!]!`

### `getPostStats`
Returns post statistics for the dashboard.

**Returns:** `PostStats!`

**Example:**
```graphql
query {
  getPostStats {
    planned
    pending
    scheduled
    published
  }
}
```

## Mutations

### `createPostGroup(input: CreatePostGroupInput!)`
Creates a new post group.

**Arguments:**
- `input: CreatePostGroupInput!`

**Returns:** `PostGroup!`

**Example:**
```graphql
mutation CreatePost($input: CreatePostGroupInput!) {
  createPostGroup(input: $input) {
    id
    content
    status
    scheduledDate
    posts {
      platform
      caption
    }
  }
}
```

**Input Variables:**
```json
{
  "input": {
    "content": "Base content for all platforms",
    "mediaUrls": ["https://example.com/image1.jpg"],
    "pillar": "AUTHORITY",
    "scheduledDate": "2024-12-31T18:00:00Z",
    "posts": [
      {
        "platform": "FACEBOOK",
        "caption": "Facebook-specific caption"
      },
      {
        "platform": "INSTAGRAM",
        "caption": "Instagram caption with #hashtags"
      }
    ]
  }
}
```

### `approvePostGroup(id: ID!)`
Approves a post group, moving it from pending to scheduled/published.

**Arguments:**
- `id: ID!` - The post group ID

**Returns:** `PostGroup!`

**Example:**
```graphql
mutation ApprovePost($id: ID!) {
  approvePostGroup(id: $id) {
    id
    status
    publishedDate
  }
}
```

## Types

### `PostGroup`
```graphql
type PostGroup {
  id: ID!
  content: String!
  mediaUrls: [String!]!
  pillar: SocialPillar!
  status: PostStatus!
  scheduledDate: DateTime!
  publishedDate: DateTime
  posts: [Post!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### `Post`
```graphql
type Post {
  id: ID!
  platform: SocialPlatform!
  caption: String!
  likes: Int!
  comments: Int!
  shares: Int!
  postGroup: PostGroup!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### `PostStats`
```graphql
type PostStats {
  planned: Int!
  pending: Int!
  scheduled: Int!
  published: Int!
}
```

## Enums

### `PostStatus`
```graphql
enum PostStatus {
  PENDING_REVIEW
  SCHEDULED
  PUBLISHED
}
```

### `SocialPlatform`
```graphql
enum SocialPlatform {
  FACEBOOK
  INSTAGRAM
  LINKEDIN
}
```

### `SocialPillar`
```graphql
enum SocialPillar {
  AUTHORITY
  COMMUNITY
  EDUCATION
  ENTERTAINMENT
  INSPIRATION
}
```

## Input Types

### `CreatePostGroupInput`
```graphql
input CreatePostGroupInput {
  content: String!
  mediaUrls: [String!]!
  pillar: SocialPillar!
  scheduledDate: String!
  posts: [CreatePostInput!]!
}
```

### `CreatePostInput`
```graphql
input CreatePostInput {
  platform: SocialPlatform!
  caption: String!
}
```