import type { CustomerOption } from "@/features/customers/types";
import type { VehicleFormLookupData } from "@/features/vehicles/types";

export type QuotationStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "expired";

export type QuotationItemType = "product" | "service" | "labor";
export const QUOTATION_PRINT_MODE_VALUES = ["full", "parts", "labor"] as const;
export type QuotationPrintMode = (typeof QUOTATION_PRINT_MODE_VALUES)[number];

export type QuotationListItem = {
  id: string;
  quotationNumber: string;
  branchId: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleLabel: string;
  status: QuotationStatus;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
  approvedAt: string | null;
};

export type QuotationItemDetail = {
  id: string;
  lineNumber: number;
  itemType: QuotationItemType;
  productId: string | null;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitLabel: string | null;
  unitPrice: number;
  total: number;
};

export type QuotationDetail = QuotationListItem & {
  customerContactNumber: string | null;
  customerAddress: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehiclePlateNumber: string | null;
  vehicleVin: string | null;
  natureOfRepair: string | null;
  inspectionNotes: string | null;
  preparedByName: string | null;
  preparedByTitle: string | null;
  items: QuotationItemDetail[];
  jobOrderId: string | null;
  jobOrderNumber: string | null;
};

export type QuotationVehicleOption = {
  id: string;
  customerId: string;
  label: string;
};

export type QuotationProductOption = {
  id: string;
  label: string;
  sku: string | null;
  unitPrice: number;
};

export type QuotationServiceOption = {
  id: string;
  label: string;
  category: string | null;
  unitPrice: number;
};

export type QuotationFormItem = {
  key: string;
  itemType: QuotationItemType;
  productId: string;
  serviceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type QuotationFormValues = {
  quotationId?: string;
  customerId: string;
  vehicleId: string;
  natureOfRepair: string;
  inspectionNotes: string;
  status: Extract<QuotationStatus, "draft" | "pending_approval">;
  discount: string;
  tax: string;
  items: QuotationFormItem[];
};

export type QuotationFormOptions = {
  customers: CustomerOption[];
  vehicles: QuotationVehicleOption[];
  products: QuotationProductOption[];
  services: QuotationServiceOption[];
  permissions: {
    canCreateProducts: boolean;
    canCreateServices: boolean;
  };
};

export type QuotationCreateFlowOptions = QuotationFormOptions & {
  vehicleLookups: VehicleFormLookupData;
};

export type QuotationPrintBusinessProfile = {
  businessName: string;
  businessLogoUrl: string | null;
  businessVatRegistrationNo: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
};

export type QuotationPrintDocument = {
  quotation: QuotationDetail;
  businessProfile: QuotationPrintBusinessProfile;
  customerSnapshot: {
    companyName: string | null;
    email: string | null;
  };
  vehicleSnapshot: {
    color: string | null;
    mileage: number | null;
  };
  validUntil: string | null;
};
