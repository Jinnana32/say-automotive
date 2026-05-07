import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { mapServiceRowToListItem } from "@/features/services/mappers";
import type { ServiceListItem } from "@/features/services/types";
import type { TableRow } from "@/types/database";

type ServiceRow = TableRow<"services">;

export async function listServices(search?: string): Promise<ServiceListItem[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("services:read");
  let query = supabase.from("services").select("*").order("name", { ascending: true });

  if (search) {
    const escapedSearch = escapeSearchTerm(search);
    query = query.or(`name.ilike.%${escapedSearch}%,category.ilike.%${escapedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ServiceRow[]).map(mapServiceRowToListItem);
}

export const getServiceById = cache(async (serviceId: string) => {
  const { supabase } = await getAuthorizedSupabaseServerClient("services:read");
  const { data, error } = await supabase.from("services").select("*").eq("id", serviceId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ServiceRow | null) ?? null;
});

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
