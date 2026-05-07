import type { TableRow } from "@/types/database";

import type { SupplierFormValues, SupplierListItem, SupplierOption } from "@/features/suppliers/types";

type SupplierRow = TableRow<"suppliers">;

export function mapSupplierRowToListItem(row: SupplierRow): SupplierListItem {
  return {
    id: row.id,
    supplierName: row.supplier_name,
    contactPerson: row.contact_person,
    contactNumber: row.contact_number,
    email: row.email,
    paymentTerms: row.payment_terms,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSupplierRowToFormValues(row: SupplierRow): SupplierFormValues {
  return {
    supplierId: row.id,
    supplierName: row.supplier_name,
    contactPerson: row.contact_person ?? "",
    contactNumber: row.contact_number ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    paymentTerms: row.payment_terms ?? "",
    notes: row.notes ?? "",
    status: row.status,
  };
}

export function mapSupplierRowToOption(row: SupplierRow): SupplierOption {
  return {
    id: row.id,
    label: row.supplier_name,
  };
}
