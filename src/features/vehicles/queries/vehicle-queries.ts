import { cache } from "react";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import type { TableRow } from "@/types/database";
import { mapVehicleDetail, mapVehicleRowToListItem } from "@/features/vehicles/mappers";
import type { VehicleDetail, VehicleListItem } from "@/features/vehicles/types";

type VehicleRow = TableRow<"vehicles">;
type CustomerRow = TableRow<"customers">;

type VehicleWithCustomerRow = VehicleRow & {
  customers: Pick<CustomerRow, "display_name"> | Pick<CustomerRow, "display_name">[] | null;
};

export async function listVehicles(filters?: {
  search?: string;
  customerId?: string;
}): Promise<VehicleListItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:read");
  let query = applyBranchFilter(
    supabase
      .from("vehicles")
      .select("*, customers!vehicles_customer_id_fkey(display_name)")
      .order("created_at", { ascending: false }),
    branchScope.selectedBranchId,
  );

  if (filters?.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchTerm(filters.search);
    query = query.or(
      `make.ilike.%${escapedSearch}%,model.ilike.%${escapedSearch}%,plate_number.ilike.%${escapedSearch}%,vin.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(toReadableQueryError(error.message));
  }

  return ((data ?? []) as VehicleWithCustomerRow[]).map((vehicle) =>
    mapVehicleRowToListItem(vehicle, resolveCustomerName(vehicle.customers)),
  );
}

export const getVehicleById = cache(async (vehicleId: string): Promise<VehicleDetail | null> => {
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:read");
  const { data, error } = await applyBranchFilter(
    supabase.from("vehicles").select("*, customers!vehicles_customer_id_fkey(display_name)"),
    branchScope.selectedBranchId,
  )
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    throw new Error(toReadableQueryError(error.message));
  }

  if (!data) {
    return null;
  }

  const vehicle = data as VehicleWithCustomerRow;

  return mapVehicleDetail(vehicle, resolveCustomerName(vehicle.customers));
});

function resolveCustomerName(
  customers: VehicleWithCustomerRow["customers"],
) {
  if (!customers) {
    return "Unknown customer";
  }

  if (Array.isArray(customers)) {
    return customers[0]?.display_name ?? "Unknown customer";
  }

  return customers.display_name || "Unknown customer";
}

function toReadableQueryError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("fetch failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("enotfound") ||
    normalized.includes("econn")
  ) {
    return "Could not reach the database. Check your internet connection and try again.";
  }

  return message;
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
