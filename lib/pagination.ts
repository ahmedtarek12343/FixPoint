/** Plain module: shared by server functions, query options, and components. */

export const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/** Offset paging rather than cursors: these lists are small, and page numbers
 *  are easier to reason about than opaque cursors. Swap to cursors if a list
 *  ever grows past a few thousand rows. */
export type PageArgs = {
  page?: number;
  pageSize?: number;
};

export type Page<T> = {
  items: T[];
  total: number;
  /** 1-based. */
  page: number;
  pageSize: number;
  pageCount: number;
};

/** Page numbers arrive from the client, so they're clamped, not trusted. */
export function normalizePageArgs({ page, pageSize }: PageArgs = {}) {
  const safeSize = Math.min(
    Math.max(Math.trunc(pageSize ?? DEFAULT_PAGE_SIZE), 1),
    MAX_PAGE_SIZE
  );
  const safePage = Math.max(Math.trunc(page ?? 1), 1);

  return {
    page: safePage,
    pageSize: safeSize,
    skip: (safePage - 1) * safeSize,
    take: safeSize,
  };
}

export function toPage<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): Page<T> {
  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
  };
}
