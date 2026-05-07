import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { mapStaffRowToListItem } from "@/features/staff/mappers";
import type { StaffListItem } from "@/features/staff/types";
import type { TableRow } from "@/types/database";

type StaffRow = TableRow<"staff">;

export async function listStaff(filters?: {
  search?: string;
  role?: StaffRow["role"];
}): Promise<StaffListItem[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("staff:read");
  let query = supabase.from("staff").select("*").order("last_name", { ascending: true });

  if (filters?.role) {
    query = query.eq("role", filters.role);
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchTerm(filters.search);
    query = query.or(
      `first_name.ilike.%${escapedSearch}%,last_name.ilike.%${escapedSearch}%,contact_number.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as StaffRow[]).map(mapStaffRowToListItem);
}

export const getStaffById = cache(async (staffId: string) => {
  const { supabase } = await getAuthorizedSupabaseServerClient("staff:read");
  const { data, error } = await supabase.from("staff").select("*").eq("id", staffId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as StaffRow | null) ?? null;
});

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
