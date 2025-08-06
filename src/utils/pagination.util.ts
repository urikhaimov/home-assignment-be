import { PageInfo } from '../graphql/graphql.types';

export interface PaginationArgs {
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
}

export class PaginationUtil {
  private static readonly DEFAULT_PAGE_SIZE = 10;
  private static readonly MAX_PAGE_SIZE = 100;
  private static readonly base64Zero = Buffer.from('0').toString('base64');

  static validatePaginationArgs(args: PaginationArgs): void {
    const { first, last, after, before } = args;

    // Validate that we don't have conflicting pagination arguments
    if (
      (typeof first === 'number' && typeof last === 'number') ||
      (first && before) ||
      (last && after) ||
      (after && before)
    ) {
      throw new Error('Invalid paging parameters');
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

  /**
   * Gets pagination parameters (take/skip) from GraphQL cursor-based arguments
   */
  static getPagingParams(
    first?: number,
    after?: string,
    last?: number,
    before?: string,
    totalItemsCount?: number,
  ) {
    // Validate arguments
    if (
      (typeof first === 'number' && typeof last === 'number') ||
      (first && before) ||
      (last && after) ||
      (after && before)
    ) {
      throw new Error('Invalid paging parameters');
    }

    // Backward pagination (last/before)
    if (last) {
      if (!totalItemsCount && !before) {
        throw new Error(
          'either totalItemsCount or before is required for backward pagination',
        );
      }

      const take = last;
      // totalCount includes the last element, before doesn't => total + 1
      const numBefore = before
        ? Number(Buffer.from(before, 'base64').toString())
        : (totalItemsCount || 0) + 1;

      if (numBefore - take - 1 <= 0) {
        return { take, skip: 0 };
      }
      const skip = numBefore - take - 1;
      return { take, skip };
    }

    // Forward pagination (first/after)
    if (first) {
      const take = first;
      const skip = Number(
        Buffer.from(after || this.base64Zero, 'base64').toString(),
      );
      return { take, skip };
    }

    // Default pagination (no arguments)
    return { take: this.DEFAULT_PAGE_SIZE, skip: 0 };
  }

  static buildConnection<T>(items: T[], skip: number, totalItemCount: number) {
    const edges = this.getEdges(skip, items);
    const pageInfo = this.getPageInfo(edges, skip, totalItemCount);

    return {
      pageInfo,
      edges,
      totalCount: totalItemCount,
    };
  }

  static getPageInfo(
    edges: { cursor: string }[],
    skip = 0,
    totalItemCount?: number,
  ): PageInfo {
    return {
      startCursor: edges?.length > 0 ? edges[0].cursor : undefined,
      endCursor: edges?.length > 0 ? edges[edges.length - 1].cursor : undefined,
      hasNextPage:
        typeof totalItemCount === 'number'
          ? edges.length + skip < totalItemCount
          : edges?.length > 0,
      hasPreviousPage: skip > 0,
    };
  }

  static getEdges<T>(start: number, items: T[]) {
    if (!items || !items.length) {
      return [];
    }
    return items.map((item, idx) => ({
      //Being implemented with +1 because it is being translated to how many items to skip
      cursor: Buffer.from((start + idx + 1).toString()).toString('base64'),
      node: item,
    }));
  }
}
