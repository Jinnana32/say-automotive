import type { TableRow } from "@/types/database";

import type { StaffFormValues, StaffListItem } from "@/features/staff/types";

type StaffRow = TableRow<"staff">;

export function mapStaffRowToListItem(row: StaffRow): StaffListItem {
  return {
    id: row.id,
    staffCode: row.staff_code ?? null,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    role: row.role,
    contactNumber: row.contact_number,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapStaffRowToFormValues(row: StaffRow): StaffFormValues {
  return {
    staffId: row.id,
    staffCode: row.staff_code ?? "",
    firstName: row.first_name,
    lastName: row.last_name,
    documentTitle: row.document_title ?? "",
    role: row.role,
    contactNumber: row.contact_number ?? "",
    address: row.address ?? "",
    sssNumber: row.sss_number ?? "",
    philhealthNumber: row.philhealth_number ?? "",
    tinNumber: row.tin_number ?? "",
    emergencyContactName: row.emergency_contact_name ?? "",
    emergencyContactNumber: row.emergency_contact_number ?? "",
    status: row.status,
  };
}
