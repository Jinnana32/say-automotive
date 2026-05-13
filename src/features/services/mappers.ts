import type { TableRow } from "@/types/database";

import { formatMoneyInputValue } from "@/lib/currency";
import type { ServiceFormValues, ServiceListItem } from "@/features/services/types";

type ServiceRow = TableRow<"services">;

export function mapServiceRowToListItem(row: ServiceRow): ServiceListItem {
  return {
    id: row.id,
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
