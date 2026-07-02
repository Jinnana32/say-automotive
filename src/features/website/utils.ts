import type {
  WebsitePostCategory,
  WebsiteQuoteRequestStatus,
} from "@/features/website/types";

const PLACEHOLDER_DESCRIPTION_PATTERNS = [
  /^sample\s*test$/i,
  /^simple\s*parts$/i,
  /^featured automotive product from say auto care\.?$/i,
] as const;

export const WEBSITE_TIRE_PRODUCT_DESCRIPTION =
  "Passenger tire option available for fitment checking. Contact the shop for availability and current pricing.";

export const WEBSITE_DEFAULT_PRODUCT_DESCRIPTION =
  "Workshop product available for fitment and availability checking. Contact the shop for current stock and pricing.";

export function sanitizeWebsiteBrandName(name: string | null | undefined) {
  if (!name) {
    return null;
  }

  return name.replace(/Maxtrex/gi, "Maxtrek");
}

export function sanitizeWebsiteProductName(name: string) {
  return name.replace(/Maxtrex/gi, "Maxtrek");
}

export function isPlaceholderWebsiteProductDescription(text: string | null | undefined) {
  const normalized = text?.trim() ?? "";

  if (!normalized) {
    return true;
  }

  return PLACEHOLDER_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isWebsiteTireProduct(input: {
  name: string;
  categoryName?: string | null;
  productType?: string | null;
}) {
  const haystack = `${input.name} ${input.categoryName ?? ""} ${input.productType ?? ""}`.toLowerCase();
  return haystack.includes("tire");
}

export function resolveWebsiteProductDisplayDescription(input: {
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  categoryName?: string | null;
  productType?: string | null;
}) {
  const candidates = [input.shortDescription, input.description];

  for (const candidate of candidates) {
    const normalized = candidate?.trim() ?? "";

    if (normalized && !isPlaceholderWebsiteProductDescription(normalized)) {
      return normalized;
    }
  }

  if (isWebsiteTireProduct(input)) {
    return WEBSITE_TIRE_PRODUCT_DESCRIPTION;
  }

  return WEBSITE_DEFAULT_PRODUCT_DESCRIPTION;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getWebsitePostCategoryLabel(category: WebsitePostCategory) {
  return category === "maintenance_tip"
    ? "Maintenance Tip"
    : category === "promo"
      ? "Promo"
      : "Shop Update";
}

export function getWebsiteQuoteRequestTone(status: WebsiteQuoteRequestStatus) {
  return status === "new"
    ? "warning"
    : status === "reviewed"
      ? "info"
      : status === "contacted"
        ? "default"
        : status === "quoted"
          ? "success"
        : "neutral";
}

export function resolveWebsiteProductRouteSegment(params: {
  id: string;
  websiteSlug: string | null;
}) {
  const normalizedSlug = params.websiteSlug?.trim() ?? "";
  return normalizedSlug || params.id;
}

export function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}
