export type ProductStatus = "active" | "inactive";
export type ProductType = "part" | "fluid" | "consumable" | "accessory" | "tool";

export type ProductListItem = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  productType: ProductType;
  categoryName: string | null;
  brandName: string | null;
  unitLabel: string;
  supplierName: string | null;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  websiteVisible: boolean;
  websiteFeatured: boolean;
  websiteSortOrder: number;
  websiteSlug: string | null;
  websiteImageUrl: string | null;
  websiteShortDescription: string | null;
  websiteBadge: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormValues = {
  productId?: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  brandId: string;
  supplierId: string;
  unitId: string;
  partNumber: string;
  oemNumber: string;
  description: string;
  productType: ProductType;
  costPrice: string;
  sellingPrice: string;
  reorderLevel: string;
  warrantyDurationDays: string;
  shelfLocation: string;
  websiteVisible: boolean;
  websiteFeatured: boolean;
  websiteSortOrder: string;
  websiteSlug: string;
  websiteImageUrl: string;
  websiteShortDescription: string;
  websiteBadge: string;
  status: ProductStatus;
};

export type ReferenceOption = {
  id: string;
  label: string;
};
