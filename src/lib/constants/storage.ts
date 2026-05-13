export const BUSINESS_ASSETS_BUCKET = "business-assets";
export function buildBusinessLogoObjectKey(branchId: string) {
  return `business-logos/${branchId}/logo`;
}
