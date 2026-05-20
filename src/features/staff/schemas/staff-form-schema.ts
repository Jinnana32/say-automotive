import { z } from "zod";

import type { StaffFormValues } from "@/features/staff/types";

export const staffFormSchema = z.object({
  staffId: z.string().uuid().optional(),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  documentTitle: z.string().trim(),
  role: z.enum(["owner", "admin", "mechanic", "cashier", "inventory_staff", "service_advisor"]),
  contactNumber: z.string().trim(),
  address: z.string().trim(),
  sssNumber: z.string().trim(),
  philhealthNumber: z.string().trim(),
  tinNumber: z.string().trim(),
  emergencyContactName: z.string().trim(),
  emergencyContactNumber: z.string().trim(),
  status: z.enum(["active", "inactive"]),
});

export function parseStaffFormData(formData: FormData): StaffFormValues {
  return {
    staffId: readString(formData, "staffId") || undefined,
    firstName: readString(formData, "firstName"),
    lastName: readString(formData, "lastName"),
    documentTitle: readString(formData, "documentTitle"),
    role: readString(formData, "role") as StaffFormValues["role"],
    contactNumber: readString(formData, "contactNumber"),
    address: readString(formData, "address"),
    sssNumber: readString(formData, "sssNumber"),
    philhealthNumber: readString(formData, "philhealthNumber"),
    tinNumber: readString(formData, "tinNumber"),
    emergencyContactName: readString(formData, "emergencyContactName"),
    emergencyContactNumber: readString(formData, "emergencyContactNumber"),
    status: readString(formData, "status") as StaffFormValues["status"],
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
