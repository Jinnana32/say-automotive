export type ProductStatus = "active" | "inactive";
export type ProductType = "part" | "fluid" | "consumable" | "accessory" | "tool";

export type ProductListItem = {
  id: string;
  branchId: string;
  owningBranchName: string | null;
  isGlobal: boolean;
  canManage: boolean;
  name: string;
  sku: string | null;
  barcode: string | null;
  productImageUrl: string | null;
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
  owningBranchId: string;
  shareGlobally: boolean;
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
  productImageUrl: string;
  websiteImageUrl: string;
  websiteShortDescription: string;
  websiteBadge: string;
  status: ProductStatus;
};

export type ProductFormOptionsData = {
  categories: ReferenceOption[];
  brands: ReferenceOption[];
  suppliers: ReferenceOption[];
  units: ReferenceOption[];
  branches: ReferenceOption[];
  permissions: {
    canMarkGlobal: boolean;
    canSelectOwningBranch: boolean;
  };
  defaultBranchId: string;
};

export type ProductInlineCreateResult = {
  id: string;
  label: string;
  sku: string | null;
  barcode: string | null;
  productType: ProductType;
  unitLabel: string;
  unitPrice: number;
  costPrice: number;
  reorderLevel: number;
  shelfLocation: string | null;
  productImageUrl: string | null;
};

export type ReferenceOption = {
  id: string;
  label: string;
};
