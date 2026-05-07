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
