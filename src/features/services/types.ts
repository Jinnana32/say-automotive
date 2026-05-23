export type ServiceStatus = "active" | "inactive";

export type ServiceListItem = {
  id: string;
  branchId: string;
  owningBranchName: string | null;
  isGlobal: boolean;
  canManage: boolean;
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
  owningBranchId: string;
  shareGlobally: boolean;
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

export type ServiceFormOptionsData = {
  branches: Array<{ id: string; label: string }>;
  permissions: {
    canMarkGlobal: boolean;
    canSelectOwningBranch: boolean;
  };
  defaultBranchId: string;
};
