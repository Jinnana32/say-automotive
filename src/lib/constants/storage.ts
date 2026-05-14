export const BUSINESS_ASSETS_BUCKET = "business-assets";
import { randomUUID } from "node:crypto";

export function buildBusinessLogoObjectKey(branchId: string, fileName: string) {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase() ?? ""}` : "";

  return `business-logos/${branchId}/${Date.now()}-${randomUUID()}${extension}`;
}
