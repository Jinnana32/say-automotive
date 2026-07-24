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
  staffCode: string | null;
  fullName: string;
  role: StaffRole;
  contactNumber: string | null;
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
};

export type StaffFormValues = {
  staffId?: string;
  staffCode: string;
  firstName: string;
  lastName: string;
  documentTitle: string;
  role: StaffRole;
  isPayrollEligible: boolean;
  contactNumber: string;
  address: string;
  sssNumber: string;
  philhealthNumber: string;
  tinNumber: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  status: StaffStatus;
  portalLoginEmail: string;
};

export type StaffPortalLoginDetails = {
  email: string;
  isLinked: boolean;
};

export type StaffCreateActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  staffId?: string;
  portalLogin?: {
    email: string;
    temporaryPassword: string;
  };
};

export function getDefaultPayrollEligibilityForRole(role: StaffRole) {
  return role !== "owner" && role !== "admin";
}
