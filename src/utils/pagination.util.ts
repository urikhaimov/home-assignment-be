import {
  PostGroupEdge,
  PostGroupConnection,
  PageInfo,
} from '../graphql/graphql.types';
import { PostGroup } from '../entities/post-group.entity';

export interface PaginationArgs {
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
}

export interface PaginationResult<T> {
  nodes: T[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export class PaginationUtil {
  private static readonly DEFAULT_PAGE_SIZE = 10;
  private static readonly MAX_PAGE_SIZE = 100;

  static encodeCursor(id: string, createdAt: Date): string {
    const cursor = Buffer.from(`${createdAt.getTime()}_${id}`).toString(
      'base64',
    );
    return cursor;
  }

  static decodeCursor(cursor: string): { createdAt: Date; id: string } {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('ascii');
      const [timestamp, id] = decoded.split('_');
      return {
        createdAt: new Date(parseInt(timestamp)),
        id,
      };
    } catch {
      throw new Error('Invalid cursor format');
    }
  }

  static validatePaginationArgs(args: PaginationArgs): void {
    const { first, last, after, before } = args;

    // Validate that we don't have conflicting pagination arguments
    if (first && last) {
      throw new Error('Cannot provide both "first" and "last" arguments');
    }

    if (after && before) {
      throw new Error('Cannot provide both "after" and "before" arguments');
    }

    // Validate page sizes (handle null values)
    if (
      first !== null &&
      first !== undefined &&
      (first < 0 || first > this.MAX_PAGE_SIZE)
    ) {
      throw new Error(
        `"first" argument must be between 0 and ${this.MAX_PAGE_SIZE}`,
      );
    }

    if (
      last !== null &&
      last !== undefined &&
      (last < 0 || last > this.MAX_PAGE_SIZE)
    ) {
      throw new Error(
        `"last" argument must be between 0 and ${this.MAX_PAGE_SIZE}`,
      );
    }
  }

  static buildPostGroupConnection(
    postGroups: PostGroup[],
    totalCount: number,
    args: PaginationArgs,
  ): PostGroupConnection {
    const edges: PostGroupEdge[] = postGroups.map((postGroup) => ({
      node: postGroup,
      cursor: this.encodeCursor(postGroup.id, postGroup.createdAt),
    }));

    const pageInfo: PageInfo = this.buildPageInfo(edges, totalCount, args);

    return {
      edges,
      pageInfo,
      totalCount,
    };
  }

  private static buildPageInfo(
    edges: PostGroupEdge[],
    totalCount: number,
    args: PaginationArgs,
  ): PageInfo {
    const { first, last, after, before } = args;

    const startCursor = edges.length > 0 ? edges[0].cursor : undefined;
    const endCursor =
      edges.length > 0 ? edges[edges.length - 1].cursor : undefined;

    let hasNextPage = false;
    let hasPreviousPage = false;

    if (first) {
      // Forward pagination
      const requestedCount = first;
      hasNextPage =
        edges.length === requestedCount && totalCount > requestedCount;
      hasPreviousPage = !!after; // If we have 'after', there are previous pages
    } else if (last) {
      // Backward pagination
      const requestedCount = last;
      hasPreviousPage =
        edges.length === requestedCount && totalCount > requestedCount;
      hasNextPage = !!before; // If we have 'before', there are next pages
    }

    return {
      hasNextPage,
      hasPreviousPage,
      startCursor,
      endCursor,
    };
  }

  static getPageSize(args: PaginationArgs): number {
    const { first, last } = args;
    return first || last || this.DEFAULT_PAGE_SIZE;
  }
}
