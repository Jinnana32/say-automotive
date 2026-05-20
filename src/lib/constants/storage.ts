import { randomUUID } from "node:crypto";

export const BUSINESS_ASSETS_BUCKET = "business-assets";

export function buildBusinessLogoObjectKey(branchId: string, fileName: string) {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`
    : "";

  return `business-logos/${branchId}/${Date.now()}-${randomUUID()}${extension}`;
}

export function buildProductImageObjectKey(productId: string, fileName: string) {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`
    : "";

  return `product-images/${productId}/${Date.now()}-${randomUUID()}${extension}`;
}
