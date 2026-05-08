import type { TableRow } from "@/types/database";

import type {
  CustomerDetail,
  CustomerDocumentHistoryItem,
  CustomerFormValues,
  CustomerListItem,
  CustomerOption,
  CustomerVehicleSummary,
} from "@/features/customers/types";

type CustomerRow = TableRow<"customers">;
type VehicleRow = TableRow<"vehicles">;
type CustomerListRow = Pick<
  CustomerRow,
  | "id"
  | "customer_code"
  | "customer_type"
  | "display_name"
  | "contact_number"
  | "email"
  | "status"
  | "created_at"
  | "updated_at"
>;
type CustomerOptionRow = Pick<CustomerRow, "id" | "display_name">;

export function mapCustomerRowToListItem(row: CustomerListRow): CustomerListItem {
  return {
    id: row.id,
    customerCode: row.customer_code,
    customerType: row.customer_type,
    displayName: row.display_name,
    contactNumber: row.contact_number,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVehicleRowToCustomerVehicleSummary(row: VehicleRow): CustomerVehicleSummary {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    plateNumber: row.plate_number,
    vin: row.vin,
    status: row.status,
  };
}

export function mapCustomerDetail(
  row: CustomerRow,
  vehicleRows: VehicleRow[],
  documentHistory: CustomerDocumentHistoryItem[],
): CustomerDetail {
  return {
    ...mapCustomerRowToListItem(row),
    firstName: row.first_name,
    lastName: row.last_name,
    companyName: row.company_name,
    address: row.address,
    notes: row.notes,
    vehicles: vehicleRows.map(mapVehicleRowToCustomerVehicleSummary),
    documentHistory,
  };
}

export function mapCustomerRowToOption(row: CustomerOptionRow): CustomerOption {
  return {
    id: row.id,
    label: row.display_name,
  };
}

export function mapCustomerDetailToFormValues(customer: CustomerDetail): CustomerFormValues {
  return {
    customerId: customer.id,
    customerType: customer.customerType,
    firstName: customer.firstName ?? "",
    lastName: customer.lastName ?? "",
    companyName: customer.companyName ?? "",
    contactNumber: customer.contactNumber ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    notes: customer.notes ?? "",
    status: customer.status,
  };
}
