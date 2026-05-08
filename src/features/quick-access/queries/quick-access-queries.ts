import { redirect } from "next/navigation";

import type { AppCapability } from "@/lib/auth/permissions";
import { mapCustomerDetail } from "@/features/customers/mappers";
import { mapQuotationRowToListItem, mapVehicleRowToQuotationOption } from "@/features/quotations/mappers";
import type { QuotationListItem } from "@/features/quotations/types";
import { listServiceHistoryByVehicleIdsForContext } from "@/features/service-history/queries/service-history-queries";
import { groupServiceHistoryByVehicle } from "@/features/service-history/utils";
import type {
  QuickAccessCustomerRecord,
  QuickAccessRecordMatch,
  QuickAccessSearchState,
} from "@/features/quick-access/types";
import { isPossiblePlateMatch, normalizeQuickAccessPlate } from "@/features/quick-access/utils";
import { mapVehicleDetail } from "@/features/vehicles/mappers";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";

type CustomerRow = TableRow<"customers">;
type VehicleRow = TableRow<"vehicles">;
type QuotationRow = TableRow<"quotations">;

export async function getQuickAccessSearchState({
  plate,
  lastName,
}: {
  plate?: string;
  lastName?: string;
}): Promise<QuickAccessSearchState> {
  const context = await requireAuthenticatedStaff();

  if (
    !context.capabilities.includes("vehicles:read") ||
    !context.capabilities.includes("customers:read")
  ) {
    redirect("/forbidden");
  }

  const permissions = {
    canCreateQuotations: context.capabilities.includes("quotations:write"),
    canViewQuotations: context.capabilities.includes("quotations:read"),
    canViewServiceHistory: context.capabilities.includes("job_orders:read"),
  };
  const supabase = await getSupabaseServerClient();
  const plateQuery = plate?.trim() ?? "";
  const customerLastNameQuery = plateQuery ? "" : lastName?.trim() ?? "";
  const records = plateQuery
    ? await searchQuickAccessByPlate(
        supabase,
        context.capabilities,
        plateQuery,
        permissions.canViewQuotations,
      )
    : customerLastNameQuery
      ? await searchQuickAccessByCustomerLastName(
          supabase,
          context.capabilities,
          customerLastNameQuery,
          permissions.canViewQuotations,
        )
      : [];

  return {
    plateQuery,
    customerLastNameQuery,
    records,
    permissions,
  };
}

async function searchQuickAccessByPlate(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  capabilities: readonly AppCapability[],
  plateQuery: string,
  canViewQuotations: boolean,
) {
  const normalizedQuery = normalizeQuickAccessPlate(plateQuery);

  if (!normalizedQuery) {
    return [];
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .not("plate_number", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const vehicles = (data ?? []) as VehicleRow[];
  const exactVehicleRows = vehicles.filter(
    (vehicle) => normalizeQuickAccessPlate(vehicle.plate_number ?? "") === normalizedQuery,
  );
  const matchedVehicleRows =
    exactVehicleRows.length > 0
      ? exactVehicleRows.map((vehicleRow) => ({
          vehicleRow,
          match: {
            source: "plate" as const,
            label: "Exact plate match",
            plateMatchKind: "exact" as const,
          },
        }))
      : vehicles
          .filter((vehicle) => isPossiblePlateMatch(vehicle.plate_number, normalizedQuery))
          .map((vehicleRow) => ({
            vehicleRow,
            match: {
              source: "plate" as const,
              label: "Possible plate match",
              plateMatchKind: "possible" as const,
            },
          }));

  if (matchedVehicleRows.length === 0) {
    return [];
  }

  const customerIds = [...new Set(matchedVehicleRows.map(({ vehicleRow }) => vehicleRow.customer_id))];
  const [{ data: customers, error: customerError }, { data: relatedVehicles, error: vehicleError }] =
    await Promise.all([
      supabase.from("customers").select("*").in("id", customerIds),
      supabase.from("vehicles").select("*").in("customer_id", customerIds).order("created_at", {
        ascending: false,
      }),
    ]);

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (vehicleError) {
    throw new Error(vehicleError.message);
  }

  return buildQuickAccessRecords({
    supabase,
    capabilities,
    customerRows: (customers ?? []) as CustomerRow[],
    vehicleRows: (relatedVehicles ?? []) as VehicleRow[],
    matches: matchedVehicleRows.map(({ vehicleRow, match }) => ({
      customerId: vehicleRow.customer_id,
      highlightedVehicleId: vehicleRow.id,
      match,
    })),
    canViewQuotations,
  });
}

async function searchQuickAccessByCustomerLastName(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  capabilities: readonly AppCapability[],
  lastNameQuery: string,
  canViewQuotations: boolean,
) {
  const escapedLastName = escapeSearchTerm(lastNameQuery);
  const { data: customers, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .or(`last_name.ilike.%${escapedLastName}%,display_name.ilike.%${escapedLastName}%`)
    .order("display_name", { ascending: true })
    .limit(12);

  if (customerError) {
    throw new Error(customerError.message);
  }

  const customerRows = (customers ?? []) as CustomerRow[];

  if (customerRows.length === 0) {
    return [];
  }

  const customerIds = customerRows.map((customer) => customer.id);
  const { data: vehicles, error: vehicleError } = await supabase
    .from("vehicles")
    .select("*")
    .in("customer_id", customerIds)
    .order("created_at", { ascending: false });

  if (vehicleError) {
    throw new Error(vehicleError.message);
  }

  return buildQuickAccessRecords({
    supabase,
    capabilities,
    customerRows,
    vehicleRows: (vehicles ?? []) as VehicleRow[],
    matches: customerRows.map((customer) => ({
      customerId: customer.id,
      highlightedVehicleId: null,
      match: {
        source: "customer" as const,
        label: "Customer lookup result",
      },
    })),
    canViewQuotations,
  });
}

async function buildQuickAccessRecords(params: {
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  capabilities: readonly AppCapability[];
  customerRows: CustomerRow[];
  vehicleRows: VehicleRow[];
  matches: Array<{
    customerId: string;
    highlightedVehicleId: string | null;
    match: QuickAccessRecordMatch;
  }>;
  canViewQuotations: boolean;
}): Promise<QuickAccessCustomerRecord[]> {
  if (params.matches.length === 0) {
    return [];
  }

  const customerMap = new Map(params.customerRows.map((customer) => [customer.id, customer]));
  const vehiclesByCustomerId = groupVehiclesByCustomerId(params.vehicleRows);
  const quotationsByCustomerId = await listRecentQuotationsByCustomerId({
    supabase: params.supabase,
    customerRows: params.customerRows,
    vehicleRows: params.vehicleRows,
    canViewQuotations: params.canViewQuotations,
  });
  const serviceHistoryEntries = await listServiceHistoryByVehicleIdsForContext({
    supabase: params.supabase,
    capabilities: params.capabilities,
    vehicleIds: params.vehicleRows.map((vehicle) => vehicle.id),
  });
  const serviceHistoryByVehicleId = groupServiceHistoryByVehicle(serviceHistoryEntries);

  return params.matches.flatMap((match) => {
    const customerRow = customerMap.get(match.customerId);

    if (!customerRow) {
      return [];
    }

    const relatedVehicleRows = vehiclesByCustomerId.get(match.customerId) ?? [];
    const customer = mapCustomerDetail(customerRow, relatedVehicleRows, []);
    const vehicles = relatedVehicleRows.map((vehicleRow) =>
      mapVehicleDetail(vehicleRow, customer.displayName),
    );
    const recentQuotations = sortQuotationsForMatch(
      quotationsByCustomerId.get(match.customerId) ?? [],
      match.highlightedVehicleId,
    ).slice(0, 6);
    const serviceHistory = relatedVehicleRows.flatMap(
      (vehicleRow) => serviceHistoryByVehicleId.get(vehicleRow.id) ?? [],
    );

    return [
      {
        id: `${customer.id}:${match.highlightedVehicleId ?? match.match.source}`,
        customer,
        vehicles,
        recentQuotations,
        serviceHistory,
        highlightedVehicleId: match.highlightedVehicleId,
        match: match.match,
      },
    ];
  });
}

async function listRecentQuotationsByCustomerId(params: {
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  customerRows: CustomerRow[];
  vehicleRows: VehicleRow[];
  canViewQuotations: boolean;
}) {
  if (!params.canViewQuotations || params.customerRows.length === 0) {
    return new Map<string, QuotationListItem[]>();
  }

  const customerIds = params.customerRows.map((customer) => customer.id);
  const { data, error } = await params.supabase
    .from("quotations")
    .select("*")
    .in("customer_id", customerIds)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    throw new Error(error.message);
  }

  const customerNames = new Map(params.customerRows.map((customer) => [customer.id, customer.display_name]));
  const vehicleLabels = new Map(
    params.vehicleRows.map((vehicle) => [vehicle.id, mapVehicleRowToQuotationOption(vehicle).label]),
  );

  return ((data ?? []) as QuotationRow[]).reduce<Map<string, QuotationListItem[]>>((groups, quotation) => {
    const existing = groups.get(quotation.customer_id) ?? [];
    groups.set(quotation.customer_id, [
      ...existing,
      mapQuotationRowToListItem(
        quotation,
        customerNames.get(quotation.customer_id) ?? "Unknown customer",
        vehicleLabels.get(quotation.vehicle_id) ?? "Unknown vehicle",
      ),
    ]);
    return groups;
  }, new Map());
}

function sortQuotationsForMatch(
  quotations: QuotationListItem[],
  highlightedVehicleId: string | null,
) {
  return [...quotations].sort((left, right) => {
    const leftMatch = highlightedVehicleId && left.vehicleId === highlightedVehicleId ? 1 : 0;
    const rightMatch = highlightedVehicleId && right.vehicleId === highlightedVehicleId ? 1 : 0;

    if (leftMatch !== rightMatch) {
      return rightMatch - leftMatch;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function groupVehiclesByCustomerId(vehicles: VehicleRow[]) {
  return vehicles.reduce<Map<string, VehicleRow[]>>((groups, vehicle) => {
    const existing = groups.get(vehicle.customer_id) ?? [];
    groups.set(vehicle.customer_id, [...existing, vehicle]);
    return groups;
  }, new Map());
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
