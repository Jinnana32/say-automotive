import { cache } from "react";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";
import { mapVehicleDetail, mapVehicleRowToListItem } from "@/features/vehicles/mappers";
import type { VehicleDetail, VehicleListItem } from "@/features/vehicles/types";

type VehicleRow = TableRow<"vehicles">;
type CustomerRow = TableRow<"customers">;

export async function listVehicles(filters?: {
  search?: string;
  customerId?: string;
}): Promise<VehicleListItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:read");
  let query = applyBranchFilter(
    supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
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
    throw new Error(error.message);
  }

  const vehicles = (data ?? []) satisfies VehicleRow[];
  const customerIds = [...new Set(vehicles.map((vehicle) => vehicle.customer_id))];
  const customerNames = await getCustomerNameMap(customerIds);

  return vehicles.map((vehicle) =>
    mapVehicleRowToListItem(vehicle, customerNames.get(vehicle.customer_id) ?? "Unknown customer"),
  );
}

export const getVehicleById = cache(async (vehicleId: string): Promise<VehicleDetail | null> => {
  const { branchScope, supabase } = await getBranchScopedServerClient("vehicles:read");
  const { data, error } = await applyBranchFilter(
    supabase.from("vehicles").select("*"),
    branchScope.selectedBranchId,
  )
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const vehicle = data satisfies VehicleRow;
  const customerNames = await getCustomerNameMap([vehicle.customer_id]);

  return mapVehicleDetail(vehicle, customerNames.get(vehicle.customer_id) ?? "Unknown customer");
});

async function getCustomerNameMap(customerIds: string[]) {
  if (customerIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, display_name")
    .in("id", customerIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as Pick<CustomerRow, "id" | "display_name">[]).map((customer) => [
      customer.id,
      customer.display_name,
    ]),
  );
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
