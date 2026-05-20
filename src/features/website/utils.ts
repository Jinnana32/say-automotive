import type {
  WebsitePostCategory,
  WebsiteQuoteRequestStatus,
} from "@/features/website/types";

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
