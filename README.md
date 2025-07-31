# Maggie Backend API

A NestJS GraphQL API for managing social media posts across multiple platforms (Facebook, Instagram, LinkedIn).

## Features

- **Post Management**: Create, approve, and manage social media post groups
- **Multi-Platform Support**: Handle posts for Facebook, Instagram, and LinkedIn
- **Post Status Workflow**: Pending Review → Scheduled → Published
- **Metrics Tracking**: Track likes, comments, and shares for published posts
- **Social Pillars**: Categorize posts by Authority, Community, Education, Entertainment, Inspiration
- **GraphQL API**: Schema-first GraphQL implementation with Relay-style cursor pagination
- **Database**: PostgreSQL with TypeORM
- **Testing**: Comprehensive unit tests with Jest
- **Docker**: Full containerization with Docker Compose

## Tech Stack

- **Framework**: NestJS 11.x
- **Database**: PostgreSQL 15 with TypeORM
- **API**: Schema-first GraphQL with Relay-style cursor pagination
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose
- **Validation**: Class Validator & Class Transformer
- **Type Generation**: Automatic TypeScript types from GraphQL schema

## Project Structure

```
src/
├── database/           # Database seeding utilities
├── entities/          # Pure TypeORM entities (no GraphQL decorators)
├── graphql/           # GraphQL schema and generated types
│   ├── schema.graphql # GraphQL schema (single source of truth)
│   └── graphql.types.ts # Generated types, enums, and inputs
├── resolvers/         # GraphQL resolvers using generated interfaces
├── scalars/           # Custom GraphQL scalars (DateTime)
├── services/          # Business logic using generated types
└── app.module.ts      # Main application module with validation
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (recommended)
- PostgreSQL 15+ (if running locally)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

### Running the Application

#### Option 1: Docker Compose (Recommended)

```bash
# Development with hot reload
npm run docker:dev

# Production
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

#### Option 2: Local Development

```bash
# Start PostgreSQL database (you can use Docker)
docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=maggie_db -p 5432:5432 -d postgres:15-alpine

# Install dependencies
npm install

# Run database migrations and seeding
npm run seed

# Start development server
npm run start:dev
```

The API will be available at:
- **GraphQL Playground**: http://localhost:3000/graphql
- **Health Check**: http://localhost:3000

### Database Seeding

The application includes comprehensive sample data for testing:

```bash
# Seed database with comprehensive sample posts
npm run seed
```

**Comprehensive Sample Data Includes:**
- **28 Post Groups** across all social pillars
- **67 Individual Posts** distributed across platforms
- **10 Posts Pending Review** - awaiting approval
- **9 Scheduled Posts** - approved and scheduled for future
- **9 Published Posts** - live with realistic engagement metrics

**Content Distribution:**
- **Authority (5 posts)**: Leadership, thought leadership, industry awards
- **Community (6 posts)**: Team building, diversity, volunteer initiatives  
- **Education (6 posts)**: Learning, mentorship, data analysis, skills
- **Entertainment (5 posts)**: Team activities, workplace culture, celebrations
- **Inspiration (6 posts)**: Motivation, personal growth, overcoming challenges

**Platform Variety:**
- **Facebook**: All posts with casual, engaging tone
- **Instagram**: Most posts with hashtags and emojis
- **LinkedIn**: Professional content for authority, education, and select community posts

**Media Assets:**
- All images sourced from **Picsum Photos** (https://picsum.photos/)
- Various dimensions: 800x600, 600x800, 1000x600, 800x800, 1200x800
- Multiple images for select posts
- Randomized, high-quality placeholder images

### Database Management with pgAdmin

The Docker setup includes pgAdmin for easy database management and inspection:

```bash
# Start database and pgAdmin together
docker-compose up -d postgres pgadmin

# Or start all services including backend
npm run docker:up
```

**Access pgAdmin:**
- **URL**: http://localhost:8080
- **Password**: password

**Connect to PostgreSQL Database:**
1. Open pgAdmin at http://localhost:8080
2. Right-click "Servers" → "Register" → "Server"
3. **General Tab:**
   - Name: `Maggie Database`
4. **Connection Tab:**
   - Host name/address: `postgres` (Docker network) or `localhost` (if accessing from host)
   - Port: `5432`
   - Maintenance database: `maggie_db`
   - Username: `postgres`
   - Password: `postgres`

**What You Can Do in pgAdmin:**
- **Browse Tables**: View `post_group` and `post` tables with all seeded data
- **Run Queries**: Execute custom SQL queries to analyze data
- **View Relationships**: Explore foreign key relationships between tables
- **Inspect Data**: Browse the 28+ post groups and 67+ posts created by seeding
- **Database Schema**: View complete table structures, indexes, and constraints

**Sample Queries to Try:**
```sql
-- View all post groups with their status distribution
SELECT status, COUNT(*) as count FROM post_groups GROUP BY status;

-- See posts by platform
SELECT platform, COUNT(*) as count FROM posts GROUP BY platform;

-- Find posts with engagement metrics
SELECT pg.content, p.platform, p.likes, p.comments, p.shares 
FROM post_groups pg 
JOIN posts p ON pg.id = p."postGroupId" 
WHERE p.likes > 0;

-- Posts by social pillar
SELECT pillar, COUNT(*) as count FROM post_groups GROUP BY pillar;
```

## GraphQL API

### Available Queries

```graphql
# Get posts pending review with pagination
query PostsPendingReview($pagination: PaginationInput) {
  postsPendingReview(pagination: $pagination) {
    edges {
      node {
        id
        content
        mediaUrls
        pillar
        status
        scheduledDate
        posts {
          platform
          caption
          likes
          comments
          shares
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}

# Get post group by ID
query PostGroupById($id: ID!) {
  postGroupById(id: $id) {
    id
    content
    status
    scheduledDate
    publishedDate
    posts {
      platform
      caption
    }
  }
}

# Get all post groups with pagination
query AllPostGroups($pagination: PaginationInput) {
  allPostGroups(pagination: $pagination) {
    edges {
      node {
        id
        content
        status
        pillar
        createdAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}

# Get post statistics
query PostStats {
  postStats {
    planned
    pending
    scheduled
    published
  }
}
```

### Available Mutations

```graphql
# Create a new post group
mutation CreatePostGroup($input: CreatePostGroupInput!) {
  createPostGroup(input: $input) {
    id
    content
    status
    scheduledDate
  }
}

# Approve a post group
mutation ApprovePostGroup($id: ID!) {
  approvePostGroup(id: $id) {
    id
    status
    publishedDate
  }
}
```

### Pagination Examples

```graphql
# Forward pagination - Get first 5 posts
{
  "pagination": {
    "first": 5
  }
}

# Forward pagination with cursor - Get next 5 posts after cursor
{
  "pagination": {
    "first": 5,
    "after": "Y3JlYXRlZEF0OjE3MDMwNTAyNDAwMDBfMWFiY2Q="
  }
}

# Backward pagination - Get last 5 posts
{
  "pagination": {
    "last": 5
  }
}

# Backward pagination with cursor - Get previous 5 posts before cursor
{
  "pagination": {
    "last": 5,
    "before": "Y3JlYXRlZEF0OjE3MDMwNTAyNDAwMDBfMWFiY2Q="
  }
}
```

### Example Input Types

```graphql
# Create Post Group Input
{
  "input": {
    "content": "Join us for an amazing event!",
    "mediaUrls": ["https://example.com/image.jpg"],
    "pillar": "AUTHORITY",
    "scheduledDate": "2024-12-31T18:00:00Z",
    "posts": [
      {
        "platform": "FACEBOOK",
        "caption": "Join us for an amazing event! Don't miss out!"
      },
      {
        "platform": "INSTAGRAM", 
        "caption": "Join us for an amazing event! 🎉 #Event #Community"
      }
    ]
  }
}
```

## Data Model

### PostGroup Entity
- **id**: UUID primary key
- **content**: Base content for all posts
- **mediaUrls**: Array of image/video URLs
- **pillar**: Social pillar category
- **status**: PENDING_REVIEW | SCHEDULED | PUBLISHED
- **scheduledDate**: When post should be published
- **publishedDate**: When post was actually published
- **posts**: Related Post entities

### Post Entity
- **id**: UUID primary key
- **platform**: FACEBOOK | INSTAGRAM | LINKEDIN
- **caption**: Platform-specific caption
- **likes**: Number of likes (for published posts)
- **comments**: Number of comments (for published posts)
- **shares**: Number of shares (for published posts)
- **postGroup**: Related PostGroup entity

## Business Logic

### Post Approval Workflow

1. **Create Post Group**: Posts start in `PENDING_REVIEW` status
2. **Approve Post**: 
   - If scheduled date is in the future → status becomes `SCHEDULED`
   - If scheduled date is in the past → status becomes `PUBLISHED` immediately
3. **Published Posts**: Can have engagement metrics (likes, comments, shares)

### Social Pillars

- **AUTHORITY**: Expert content and thought leadership
- **COMMUNITY**: Community building and engagement
- **EDUCATION**: Educational and informational content
- **ENTERTAINMENT**: Fun and engaging content
- **INSPIRATION**: Motivational and inspiring content

## Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov

# Run e2e tests
npm run test:e2e
```

Test coverage includes:
- Service layer business logic
- GraphQL resolver functionality
- Database operations
- Error handling scenarios

## Production Deployment

### Docker Production Build

```bash
# Build production image
npm run docker:build

# Run production container
docker run -p 3000:3000 -e DB_HOST=your-db-host maggie-backend
```

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=maggie_db

# Application
NODE_ENV=production
PORT=3000

# GraphQL
GRAPHQL_PLAYGROUND=false
GRAPHQL_INTROSPECTION=false
```

## API Documentation

Visit the GraphQL Playground at `http://localhost:3000/graphql` to:
- Explore the complete schema
- Test queries and mutations
- View real-time documentation
- Access query examples

## Schema-First GraphQL

This project uses a **schema-first** approach to GraphQL development:

### Benefits
- **Schema as Single Source of Truth**: The GraphQL schema (`src/graphql/schema.graphql`) defines the API contract
- **Type Safety**: Automatic generation of TypeScript types from the schema
- **Better Collaboration**: Frontend and backend teams can work from the same schema definition
- **Schema Evolution**: Changes to the schema automatically propagate to TypeScript types

### How it Works
1. **Define Schema**: Write GraphQL schema in `src/graphql/schema.graphql`
2. **Generate Types**: TypeScript interfaces are automatically generated in `src/graphql/graphql.types.ts`
3. **Implement Resolvers**: Resolvers implement the generated interfaces for type safety
4. **Custom Scalars**: Custom scalars like `DateTime` handle type conversions

### Schema Files
- `src/graphql/schema.graphql` - **Single source of truth** for API definition
- `src/graphql/graphql.types.ts` - **Generated TypeScript types, interfaces, and enums**
- `src/scalars/date-time.scalar.ts` - Custom DateTime scalar implementation

### Pure Schema-First Approach
This implementation follows a **pure schema-first** methodology:
- **No separate enum files** - All enums defined in GraphQL schema only
- **No DTO files** - All input types generated from GraphQL schema
- **Generated types everywhere** - All TypeScript types come from schema
- **Single source of truth** - Schema drives all type definitions
- **Clean separation** - No GraphQL decorators anywhere in codebase
- **Pure entities** - Database entities contain only TypeORM decorators
- **Relay-style pagination** - Cursor-based pagination following GraphQL best practices

## Health Checks

The application includes health checks for:
- HTTP endpoint availability
- Database connectivity
- GraphQL schema validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.