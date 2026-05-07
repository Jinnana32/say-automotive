import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { mapSupplierRowToListItem, mapSupplierRowToOption } from "@/features/suppliers/mappers";
import type { SupplierListItem, SupplierOption } from "@/features/suppliers/types";
import type { TableRow } from "@/types/database";

type SupplierRow = TableRow<"suppliers">;

export async function listSuppliers(search?: string): Promise<SupplierListItem[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("suppliers:read");
  let query = supabase.from("suppliers").select("*").order("supplier_name", { ascending: true });

  if (search) {
    const escapedSearch = escapeSearchTerm(search);
    query = query.or(
      `supplier_name.ilike.%${escapedSearch}%,contact_person.ilike.%${escapedSearch}%,contact_number.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SupplierRow[]).map(mapSupplierRowToListItem);
}

export const getSupplierById = cache(async (supplierId: string) => {
  const { supabase } = await getAuthorizedSupabaseServerClient("suppliers:read");
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", supplierId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SupplierRow | null) ?? null;
});

export async function listSupplierOptions(): Promise<SupplierOption[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("suppliers:read");
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("status", "active")
    .order("supplier_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SupplierRow[]).map(mapSupplierRowToOption);
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
