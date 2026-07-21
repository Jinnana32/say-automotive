import { formatCurrency } from "@/lib/currency";

export type CatalogComboboxOption = {
  id: string;
  label: string;
  meta?: string | null;
  price?: number | null;
  searchText?: string;
};

export function mapProductOptionsToCatalog(
  options: ReadonlyArray<{
    id: string;
    label: string;
    sku: string | null;
    unitPrice: number;
  }>,
): CatalogComboboxOption[] {
  return options.map((option) => ({
    id: option.id,
    label: option.label,
    meta: option.sku ? `SKU ${option.sku}` : null,
    price: option.unitPrice,
    searchText: [option.label, option.sku].filter(Boolean).join(" "),
  }));
}

export function mapServiceOptionsToCatalog(
  options: ReadonlyArray<{
    id: string;
    label: string;
    category: string | null;
    unitPrice: number;
  }>,
): CatalogComboboxOption[] {
  return options.map((option) => ({
    id: option.id,
    label: option.label,
    meta: option.category ? `Category · ${option.category}` : null,
    price: option.unitPrice,
    searchText: [option.label, option.category].filter(Boolean).join(" "),
  }));
}

export function findCatalogOption(
  options: ReadonlyArray<CatalogComboboxOption>,
  value: string,
) {
  return options.find((option) => option.id === value) ?? null;
}

export function filterCatalogOptions(
  query: string,
  options: ReadonlyArray<CatalogComboboxOption>,
  limit = 10,
) {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = normalizedQuery
    ? options.filter((option) => {
        const haystack = [option.label, option.meta, option.searchText]
          .filter(Boolean)
          .join(" ")
          .trim()
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
    : options;

  return filtered.slice(0, limit);
}

export function formatCatalogOptionPrice(price: number | null | undefined) {
  if (price === null || price === undefined) {
    return null;
  }

  return formatCurrency(price);
}
