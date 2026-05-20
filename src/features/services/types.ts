export type ServiceStatus = "active" | "inactive";

export type ServiceListItem = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  laborPrice: number;
  estimatedDurationMinutes: number | null;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
};

export type ServiceFormValues = {
  serviceId?: string;
  name: string;
  category: string;
  description: string;
  laborPrice: string;
  estimatedDurationMinutes: string;
  status: ServiceStatus;
};

export type ServiceInlineCreateResult = {
  id: string;
  label: string;
  category: string | null;
  unitPrice: number;
};
