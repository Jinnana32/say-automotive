type QueryWithNeq<T> = {
  neq: (column: string, value: string) => T;
};

export function excludeCurrentProductId<T>(
  query: QueryWithNeq<T>,
  productId?: string | null,
  column = "id",
) {
  const trimmedProductId = productId?.trim();

  if (!trimmedProductId) {
    return query as T;
  }

  return query.neq(column, trimmedProductId);
}
