
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum PostStatus {
    PENDING_REVIEW = "PENDING_REVIEW",
    SCHEDULED = "SCHEDULED",
    PUBLISHED = "PUBLISHED"
}

export enum SocialPlatform {
    FACEBOOK = "FACEBOOK",
    INSTAGRAM = "INSTAGRAM",
    LINKEDIN = "LINKEDIN"
}

export enum SocialPillar {
    AUTHORITY = "AUTHORITY",
    COMMUNITY = "COMMUNITY",
    EDUCATION = "EDUCATION",
    ENTERTAINMENT = "ENTERTAINMENT",
    INSPIRATION = "INSPIRATION"
}

export interface PaginationInput {
    first?: Nullable<number>;
    after?: Nullable<string>;
    last?: Nullable<number>;
    before?: Nullable<string>;
}

export interface PostGroupFilters {
    status?: Nullable<PostStatus>;
    statuses?: Nullable<PostStatus[]>;
    pillar?: Nullable<SocialPillar>;
    pillars?: Nullable<SocialPillar[]>;
}

export interface CreatePostInput {
    platform: SocialPlatform;
    caption: string;
}

export interface CreatePostGroupInput {
    content: string;
    mediaUrls: string[];
    pillar: SocialPillar;
    scheduledDate: string;
    posts: CreatePostInput[];
}

export interface PostGroup {
    id: string;
    content: string;
    mediaUrls: string[];
    pillar: SocialPillar;
    status: PostStatus;
    scheduledDate: DateTime;
    publishedDate?: Nullable<DateTime>;
    posts: Post[];
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface Post {
    id: string;
    platform: SocialPlatform;
    caption: string;
    likes: number;
    comments: number;
    shares: number;
    postGroup: PostGroup;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface PostStats {
    planned: number;
    pending: number;
    scheduled: number;
    published: number;
}

export interface PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: Nullable<string>;
    endCursor?: Nullable<string>;
}

export interface PostGroupEdge {
    node: PostGroup;
    cursor: string;
}

export interface PostGroupConnection {
    edges: PostGroupEdge[];
    pageInfo: PageInfo;
    totalCount: number;
}

export interface IQuery {
    postsPendingReview(pagination?: Nullable<PaginationInput>): PostGroupConnection | Promise<PostGroupConnection>;
    postGroupById(id: string): Nullable<PostGroup> | Promise<Nullable<PostGroup>>;
    allPostGroups(pagination?: Nullable<PaginationInput>, filters?: Nullable<PostGroupFilters>): PostGroupConnection | Promise<PostGroupConnection>;
    postStats(): PostStats | Promise<PostStats>;
}

export interface IMutation {
    createPostGroup(input: CreatePostGroupInput): PostGroup | Promise<PostGroup>;
    approvePostGroup(id: string): PostGroup | Promise<PostGroup>;
}

export type DateTime = any;
type Nullable<T> = T | null;
