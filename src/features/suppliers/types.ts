export type SupplierStatus = "active" | "inactive";

export type SupplierListItem = {
  id: string;
  supplierName: string;
  contactPerson: string | null;
  contactNumber: string | null;
  email: string | null;
  paymentTerms: string | null;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
};

export type SupplierFormValues = {
  supplierId?: string;
  supplierName: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  address: string;
  paymentTerms: string;
  notes: string;
  status: SupplierStatus;
};

export type SupplierOption = {
  id: string;
  label: string;
};
