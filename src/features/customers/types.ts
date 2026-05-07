export type CustomerStatus = "active" | "inactive";
export type CustomerType = "individual" | "company" | "fleet";

export type CustomerListItem = {
  id: string;
  customerCode: string | null;
  customerType: CustomerType;
  displayName: string;
  contactNumber: string | null;
  email: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
};

export type CustomerVehicleSummary = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  plateNumber: string | null;
  vin: string | null;
  status: CustomerStatus;
};

export type CustomerDetail = CustomerListItem & {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  address: string | null;
  notes: string | null;
  vehicles: CustomerVehicleSummary[];
};

export type CustomerOption = {
  id: string;
  label: string;
};

export type CustomerFormValues = {
  customerId?: string;
  customerType: CustomerType;
  firstName: string;
  lastName: string;
  companyName: string;
  contactNumber: string;
  email: string;
  address: string;
  notes: string;
  status: CustomerStatus;
};
