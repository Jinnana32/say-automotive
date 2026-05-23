import type { TableRow } from "@/types/database";

import { formatMoneyInputValue } from "@/lib/currency";
import type { ServiceFormValues, ServiceListItem } from "@/features/services/types";

type ServiceRow = TableRow<"services">;

export function mapServiceRowToListItem(
  row: ServiceRow,
  params: {
    owningBranchName: string | null;
    canManage: boolean;
  },
): ServiceListItem {
  return {
    id: row.id,
    branchId: row.branch_id,
    owningBranchName: params.owningBranchName,
    isGlobal: row.is_global ?? false,
    canManage: params.canManage,
    name: row.name,
    category: row.category,
    description: row.description,
    laborPrice: row.labor_price,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapServiceRowToFormValues(row: ServiceRow): ServiceFormValues {
  return {
    serviceId: row.id,
    owningBranchId: row.branch_id,
    shareGlobally: row.is_global ?? false,
    name: row.name,
    category: row.category ?? "",
    description: row.description ?? "",
    laborPrice: formatMoneyInputValue(row.labor_price),
    estimatedDurationMinutes: row.estimated_duration_minutes
      ? String(row.estimated_duration_minutes)
      : "",
    status: row.status,
  };
}
