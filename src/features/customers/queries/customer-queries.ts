import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import type { TableRow } from "@/types/database";
import {
  mapCustomerDetail,
  mapCustomerRowToListItem,
  mapCustomerRowToOption,
} from "@/features/customers/mappers";
import type { CustomerDetail, CustomerListItem, CustomerOption } from "@/features/customers/types";

type CustomerRow = TableRow<"customers">;
type VehicleRow = TableRow<"vehicles">;
type CustomerListRow = Pick<
  CustomerRow,
  | "id"
  | "customer_code"
  | "customer_type"
  | "display_name"
  | "contact_number"
  | "email"
  | "status"
  | "created_at"
  | "updated_at"
>;
type CustomerOptionRow = Pick<CustomerRow, "id" | "display_name">;

export async function listCustomers(search?: string): Promise<CustomerListItem[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("customers:read");
  let query = supabase
    .from("customers")
    .select(
      "id, customer_code, customer_type, display_name, contact_number, email, status, created_at, updated_at",
    )
    .order("display_name", { ascending: true });

  if (search) {
    const escapedSearch = escapeSearchTerm(search);
    query = query.or(
      `display_name.ilike.%${escapedSearch}%,contact_number.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CustomerListRow[]).map(mapCustomerRowToListItem);
}

export const getCustomerById = cache(async (customerId: string): Promise<CustomerDetail | null> => {
  const { supabase } = await getAuthorizedSupabaseServerClient("customers:read");

  const [{ data: customer, error: customerError }, { data: vehicles, error: vehiclesError }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .maybeSingle(),
      supabase
        .from("vehicles")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
    ]);

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (vehiclesError) {
    throw new Error(vehiclesError.message);
  }

  if (!customer) {
    return null;
  }

  return mapCustomerDetail(customer satisfies CustomerRow, (vehicles ?? []) satisfies VehicleRow[]);
});

export async function listCustomerOptions(): Promise<CustomerOption[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("customers:read");
  const { data, error } = await supabase
    .from("customers")
    .select("id, display_name")
    .eq("status", "active")
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CustomerOptionRow[]).map(mapCustomerRowToOption);
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
