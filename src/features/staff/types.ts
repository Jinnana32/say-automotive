export type StaffStatus = "active" | "inactive";
export type StaffRole =
  | "owner"
  | "admin"
  | "mechanic"
  | "cashier"
  | "inventory_staff"
  | "service_advisor";

export type StaffListItem = {
  id: string;
  fullName: string;
  role: StaffRole;
  contactNumber: string | null;
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
};

export type StaffFormValues = {
  staffId?: string;
  firstName: string;
  lastName: string;
  documentTitle: string;
  role: StaffRole;
  contactNumber: string;
  address: string;
  sssNumber: string;
  philhealthNumber: string;
  tinNumber: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  status: StaffStatus;
};
