import type { ProductType, ProductStatus } from "@/features/products/types";

export type WebsitePostCategory = "shop_update" | "maintenance_tip" | "promo";
export type WebsiteQuoteRequestStatus = "new" | "reviewed" | "contacted" | "quoted" | "closed";

export type WebsiteShellData = {
  businessName: string;
  businessLogoUrl: string | null;
  branchName: string;
  address: string | null;
  contactNumber: string | null;
};

export type WebsiteCatalogProduct = {
  id: string;
  name: string;
  slug: string;
  productType: ProductType;
  categoryName: string | null;
  brandName: string | null;
  unitLabel: string;
  price: number;
  badge: string | null;
  shortDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  sortOrder: number;
};

export type WebsitePostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  category: WebsitePostCategory;
  isFeatured: boolean;
  status: ProductStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WebsitePostFormValues = {
  postId?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: WebsitePostCategory;
  isFeatured: boolean;
  status: ProductStatus;
};

export type WebsiteQuoteFormOptionData = {
  services: string[];
  vehicleMakes: Array<{ id: string; name: string }>;
  vehicleModels: Array<{ id: string; makeId: string; makeName: string; name: string }>;
  transmissions: string[];
};

export type WebsiteQuoteRequestFormValues = {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  province: string;
  city: string;
  barangay: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  transmission: string;
  mileage: string;
  engineSize: string;
  oilRequirementLiters: string;
  serviceNeeded: string;
  customerConcern: string;
};

export type WebsiteQuoteRequestListItem = {
  id: string;
  requestedProductLabel: string | null;
  firstName: string;
  lastName: string;
  contactNumber: string | null;
  email: string;
  province: string;
  city: string;
  barangay: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number | null;
  transmission: string;
  mileage: string;
  engineSize: string | null;
  oilRequirementLiters: number | null;
  serviceNeeded: string;
  customerConcern: string;
  status: WebsiteQuoteRequestStatus;
  createdAt: string;
  contactedAt: string | null;
};
