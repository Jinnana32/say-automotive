export const DEFAULT_TABLE_PAGE_SIZE = 25;

export function parsePageParam(value?: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export function paginateItems<T>(
  items: readonly T[],
  pageParam?: string,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const requestedPage = parsePageParam(pageParam);
  const page = Math.min(requestedPage, totalPages);
  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    totalItems,
    totalPages,
    page,
    pageSize,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: endIndex,
  };
}
