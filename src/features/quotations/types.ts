import type { CustomerOption } from "@/features/customers/types";
import type { VehicleFormLookupData } from "@/features/vehicles/types";

export type QuotationStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "expired";

export type QuotationItemType = "product" | "service" | "labor";

export type QuotationListItem = {
  id: string;
  quotationNumber: string;
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
  unitPrice: number;
  total: number;
};

export type QuotationDetail = QuotationListItem & {
  inspectionNotes: string | null;
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
};

export type QuotationCreateFlowOptions = QuotationFormOptions & {
  vehicleLookups: VehicleFormLookupData;
};
