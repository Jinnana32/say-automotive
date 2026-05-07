import type { CustomerDetail } from "@/features/customers/types";
import type { QuotationListItem } from "@/features/quotations/types";
import type { VehicleDetail } from "@/features/vehicles/types";

export type QuickAccessRecordMatch = {
  source: "plate" | "customer";
  label: string;
  plateMatchKind?: "exact" | "possible";
};

export type QuickAccessCustomerRecord = {
  id: string;
  customer: CustomerDetail;
  vehicles: VehicleDetail[];
  recentQuotations: QuotationListItem[];
  highlightedVehicleId: string | null;
  match: QuickAccessRecordMatch;
};

export type QuickAccessPermissions = {
  canCreateQuotations: boolean;
  canViewQuotations: boolean;
};

export type QuickAccessSearchState = {
  plateQuery: string;
  customerLastNameQuery: string;
  records: QuickAccessCustomerRecord[];
  permissions: QuickAccessPermissions;
};
