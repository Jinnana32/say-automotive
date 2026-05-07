import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { listCustomerOptions } from "@/features/customers/queries/customer-queries";
import { getVehicleFormLookupData } from "@/features/vehicles/queries/vehicle-lookup-queries";
import {
  mapProductRowToQuotationOption,
  mapQuotationDetail,
  mapQuotationRowToListItem,
  mapServiceRowToQuotationOption,
  mapVehicleRowToQuotationOption,
} from "@/features/quotations/mappers";
import type {
  QuotationCreateFlowOptions,
  QuotationDetail,
  QuotationFormOptions,
  QuotationListItem,
} from "@/features/quotations/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";

type QuotationRow = TableRow<"quotations">;
type QuotationItemRow = TableRow<"quotation_items">;
type CustomerRow = TableRow<"customers">;
type VehicleRow = TableRow<"vehicles">;
type ProductRow = TableRow<"products">;
type ServiceRow = TableRow<"services">;
type JobOrderRow = TableRow<"job_orders">;

export async function listQuotations(filters?: {
  search?: string;
  status?: QuotationRow["status"] | "";
}): Promise<QuotationListItem[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("quotations:read");
  let query = supabase
    .from("quotations")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchTerm(filters.search);
    query = query.ilike("quotation_number", `%${escapedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const quotations = (data ?? []) as QuotationRow[];
  const customerIds = [...new Set(quotations.map((row) => row.customer_id))];
  const vehicleIds = [...new Set(quotations.map((row) => row.vehicle_id))];
  const [customerMap, vehicleMap] = await Promise.all([
    getCustomerNameMap(customerIds),
    getVehicleLabelMap(vehicleIds),
  ]);

  return quotations.map((row) =>
    mapQuotationRowToListItem(
      row,
      customerMap.get(row.customer_id) ?? "Unknown customer",
      vehicleMap.get(row.vehicle_id) ?? "Unknown vehicle",
    ),
  );
}

export const getQuotationById = cache(async (quotationId: string): Promise<QuotationDetail | null> => {
  const { supabase } = await getAuthorizedSupabaseServerClient("quotations:read");

  const [
    { data: quotation, error: quotationError },
    { data: items, error: itemsError },
    { data: jobOrder, error: jobOrderError },
  ] = await Promise.all([
    supabase.from("quotations").select("*").eq("id", quotationId).maybeSingle(),
    supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", quotationId)
      .order("line_number", { ascending: true }),
    supabase
      .from("job_orders")
      .select("id, job_order_number")
      .eq("quotation_id", quotationId)
      .maybeSingle(),
  ]);

  if (quotationError) {
    throw new Error(quotationError.message);
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (jobOrderError) {
    throw new Error(jobOrderError.message);
  }

  if (!quotation) {
    return null;
  }

  const [customerMap, vehicleMap] = await Promise.all([
    getCustomerNameMap([quotation.customer_id]),
    getVehicleLabelMap([quotation.vehicle_id]),
  ]);

  return mapQuotationDetail(
    quotation as QuotationRow,
    customerMap.get(quotation.customer_id) ?? "Unknown customer",
    vehicleMap.get(quotation.vehicle_id) ?? "Unknown vehicle",
    (items ?? []) as QuotationItemRow[],
    (jobOrder as Pick<JobOrderRow, "id" | "job_order_number"> | null) ?? null,
  );
});

export async function getQuotationFormOptions(): Promise<QuotationFormOptions> {
  const { supabase } = await getAuthorizedSupabaseServerClient("quotations:write");
  const [
    customers,
    { data: vehicles, error: vehiclesError },
    { data: products, error: productsError },
    { data: services, error: servicesError },
  ] = await Promise.all([
    listCustomerOptions(),
    supabase
      .from("vehicles")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true }),
    supabase
      .from("services")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  if (vehiclesError) {
    throw new Error(vehiclesError.message);
  }

  if (productsError) {
    throw new Error(productsError.message);
  }

  if (servicesError) {
    throw new Error(servicesError.message);
  }

  return {
    customers,
    vehicles: ((vehicles ?? []) as VehicleRow[]).map(mapVehicleRowToQuotationOption),
    products: ((products ?? []) as ProductRow[]).map(mapProductRowToQuotationOption),
    services: ((services ?? []) as ServiceRow[]).map(mapServiceRowToQuotationOption),
  };
}

export async function getQuotationCreateFlowOptions(): Promise<QuotationCreateFlowOptions> {
  const [formOptions, vehicleLookups] = await Promise.all([
    getQuotationFormOptions(),
    getVehicleFormLookupData(),
  ]);

  return {
    ...formOptions,
    vehicleLookups,
  };
}

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
    ((data ?? []) as Pick<CustomerRow, "id" | "display_name">[]).map((row) => [
      row.id,
      row.display_name,
    ]),
  );
}

async function getVehicleLabelMap(vehicleIds: string[]) {
  if (vehicleIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("vehicles").select("*").in("id", vehicleIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as VehicleRow[]).map((vehicle) => {
      const option = mapVehicleRowToQuotationOption(vehicle);
      return [option.id, option.label];
    }),
  );
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
