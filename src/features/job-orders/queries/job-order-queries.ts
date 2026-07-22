import { cache } from "react";

import {
  applyBranchFilter,
  getBranchScopedServerClient,
} from "@/lib/branches";
import {
  applyCatalogVisibilityFilter,
} from "@/lib/catalog-visibility";
import type { TableRow } from "@/types/database";

import {
  buildInventoryTracking,
  mapJobOrderDetail,
  mapJobOrderPartUsageToEntry,
  mapJobOrderItemRowToDetail,
  mapJobOrderMechanicRowToAssignment,
  mapJobOrderRowToListItem,
  mapProductRowToJobOrderOption,
  mapServiceRowToJobOrderOption,
  mapStaffRowToMechanicOption,
} from "@/features/job-orders/mappers";
import type {
  JobOrderDetail,
  JobOrderFormOptions,
  JobOrderItemDetail,
  JobOrderListItem,
  JobOrderMechanicOption,
} from "@/features/job-orders/types";
import { expandJobOrderStatusFilter } from "@/features/job-orders/utils";
import { getProductFormOptions } from "@/features/products/queries/product-queries";
import type { ProductFormOptionsData } from "@/features/products/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** Keep `.in(...)` URL payloads safely under PostgREST/gateway limits. */
const IN_QUERY_CHUNK_SIZE = 80;

type JobOrderRow = TableRow<"job_orders">;
type JobOrderItemRow = TableRow<"job_order_items">;
type JobOrderMechanicRow = TableRow<"job_order_mechanics">;
type JobOrderPartUsageRow = TableRow<"job_order_part_usages">;
type CustomerRow = Pick<TableRow<"customers">, "id" | "display_name">;
type VehicleRow = TableRow<"vehicles">;
type VehicleLabelRow = Pick<VehicleRow, "id" | "make" | "model" | "year" | "plate_number">;
type QuotationRow = Pick<TableRow<"quotations">, "id" | "quotation_number">;
type JobOrderListRow = JobOrderRow & {
  customers: Pick<CustomerRow, "display_name"> | Pick<CustomerRow, "display_name">[] | null;
  vehicles:
    | Pick<VehicleRow, "make" | "model" | "year" | "plate_number">
    | Pick<VehicleRow, "make" | "model" | "year" | "plate_number">[]
    | null;
  quotations:
    | Pick<QuotationRow, "quotation_number">
    | Pick<QuotationRow, "quotation_number">[]
    | null;
};
type InvoiceSummaryRow = Pick<
  TableRow<"invoices">,
  "id" | "invoice_number" | "status" | "total_amount" | "paid_amount" | "balance"
>;
type BusinessSettingsRow = Pick<
  TableRow<"business_settings">,
  | "allow_release_with_balance"
  | "require_full_payment_before_release"
  | "require_invoice_before_job_completion"
  | "require_invoice_before_vehicle_release"
>;
type StaffRow = Pick<TableRow<"staff">, "id" | "first_name" | "last_name">;
type ProductRow = Pick<TableRow<"products">, "id" | "name" | "sku" | "selling_price">;
type ProductInventoryRow = Pick<TableRow<"products">, "id" | "reorder_level" | "shelf_location">;
type ServiceRow = Pick<TableRow<"services">, "id" | "name" | "category" | "labor_price">;
type InventoryStockRow = Pick<
  TableRow<"inventory_stocks">,
  "product_id" | "quantity_on_hand" | "available_quantity" | "reorder_level" | "shelf_location"
>;
type StockMovementRow = Pick<TableRow<"stock_movements">, "id" | "previous_quantity" | "new_quantity">;

export async function listJobOrders(filters?: {
  search?: string;
  status?: JobOrderRow["status"] | "";
}): Promise<JobOrderListItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("job_orders:read");
  let query = applyBranchFilter(
    supabase
      .from("job_orders")
      .select(
        "*, customers!job_orders_customer_id_fkey(display_name), vehicles!job_orders_vehicle_id_fkey(make, model, year, plate_number), quotations!job_orders_quotation_id_fkey(quotation_number)",
      )
      .order("created_at", { ascending: false }),
    branchScope.selectedBranchId,
  );

  if (filters?.status) {
    const matchingStatuses = expandJobOrderStatusFilter(filters.status);
    query =
      matchingStatuses.length === 1
        ? query.eq("status", matchingStatuses[0])
        : query.in("status", matchingStatuses);
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchTerm(filters.search);
    query = query.ilike("job_order_number", `%${escapedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(toReadableQueryError(error.message));
  }

  const jobOrders = (data ?? []) as JobOrderListRow[];
  const jobOrderIds = jobOrders.map((row) => row.id);

  // Secondary lookups are chunked: a single `.in()` across 500+ UUIDs exceeds PostgREST URL limits
  // and surfaces as an opaque `TypeError: fetch failed` in Next.js.
  const [itemsByJobOrderId, mechanicCountMap, invoicedJobOrderIds] = await Promise.all([
    getJobOrderItemsMap(jobOrderIds),
    getMechanicCountMap(jobOrderIds),
    getInvoicedJobOrderIdSet(jobOrderIds),
  ]);

  return jobOrders.map((row) =>
    mapJobOrderRowToListItem({
      row,
      customerName: resolveRelatedDisplayName(row.customers) ?? "Unknown customer",
      vehicleLabel: resolveRelatedVehicleLabel(row.vehicles) ?? "Unknown vehicle",
      quotationNumber: row.quotation_id ? resolveRelatedQuotationNumber(row.quotations) : null,
      assignedMechanicCount: mechanicCountMap.get(row.id) ?? 0,
      items: itemsByJobOrderId.get(row.id) ?? [],
      hasInvoice: invoicedJobOrderIds.has(row.id),
    }),
  );
}

export const getJobOrderById = cache(async (jobOrderId: string): Promise<JobOrderDetail | null> => {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("job_orders:read");
  const [
    { data: jobOrder, error: jobOrderError },
    { data: items, error: itemsError },
    { data: mechanics, error: mechanicsError },
    { data: usages, error: usagesError },
    { data: invoice, error: invoiceError },
  ] = await Promise.all([
    applyBranchFilter(
      supabase.from("job_orders").select("*"),
      branchScope.selectedBranchId,
    )
      .eq("id", jobOrderId)
      .maybeSingle(),
    supabase
      .from("job_order_items")
      .select("*")
      .eq("job_order_id", jobOrderId)
      .order("line_number", { ascending: true }),
    supabase
      .from("job_order_mechanics")
      .select("*")
      .eq("job_order_id", jobOrderId)
      .order("created_at", { ascending: true }),
    supabase
      .from("job_order_part_usages")
      .select("*")
      .eq("job_order_id", jobOrderId)
      .order("created_at", { ascending: true }),
    applyBranchFilter(
      supabase
        .from("invoices")
        .select("id, invoice_number, status, total_amount, paid_amount, balance")
        .eq("job_order_id", jobOrderId),
      branchScope.selectedBranchId,
    ).maybeSingle(),
  ]);

  if (jobOrderError) {
    throw new Error(jobOrderError.message);
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (mechanicsError) {
    throw new Error(mechanicsError.message);
  }

  if (usagesError) {
    throw new Error(usagesError.message);
  }

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  if (!jobOrder) {
    return null;
  }

  const jobOrderRow = jobOrder as JobOrderRow;
  const { data: settings, error: settingsError } = await supabase
    .from("business_settings")
    .select(
      "allow_release_with_balance, require_full_payment_before_release, require_invoice_before_job_completion, require_invoice_before_vehicle_release",
    )
    .eq("branch_id", jobOrderRow.branch_id)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const itemRows = (items ?? []) as JobOrderItemRow[];
  const mechanicRows = (mechanics ?? []) as JobOrderMechanicRow[];
  const usageRows = (usages ?? []) as JobOrderPartUsageRow[];
  const staffIds = [...new Set(mechanicRows.map((row) => row.staff_id))];
  const checklistStaffIds = [
    ...new Set(
      itemRows.flatMap((row) =>
        row.checklist_checked_by_staff_id ? [row.checklist_checked_by_staff_id] : [],
      ),
    ),
  ];
  const productIds = [
    ...new Set(itemRows.flatMap((row) => (row.product_id ? [row.product_id] : []))),
  ];
  const stockMovementIds = [
    ...new Set(usageRows.flatMap((row) => (row.stock_movement_id ? [row.stock_movement_id] : []))),
  ];

  const [customerMap, vehicleMap, quotationMap, staffMap, inventoryStockMap, productInventoryMap, stockMovementMap] =
    await Promise.all([
    getCustomerNameMap([jobOrderRow.customer_id]),
    getVehicleLabelMap([jobOrderRow.vehicle_id]),
    getQuotationNumberMap(jobOrderRow.quotation_id ? [jobOrderRow.quotation_id] : []),
    getStaffNameMap([...new Set([...staffIds, ...checklistStaffIds])]),
    getInventoryStockMap(jobOrderRow.branch_id, productIds),
    getProductInventoryMap(productIds),
    getStockMovementMap(stockMovementIds),
  ]);

  const usageHistoryMap = new Map<string, ReturnType<typeof mapJobOrderPartUsageToEntry>[]>();

  for (const row of usageRows) {
    const currentEntries = usageHistoryMap.get(row.job_order_item_id) ?? [];
    currentEntries.push(
      mapJobOrderPartUsageToEntry({
        usageRow: row,
        movementRow: row.stock_movement_id
          ? stockMovementMap.get(row.stock_movement_id) ?? null
          : null,
      }),
    );
    usageHistoryMap.set(row.job_order_item_id, currentEntries);
  }

  const itemDetails = itemRows.map((row) =>
    mapJobOrderItemRowToDetail({
      row,
      checklistCheckedByName: row.checklist_checked_by_staff_id
        ? staffMap.get(row.checklist_checked_by_staff_id) ?? null
        : null,
      inventoryTracking: buildInventoryTracking({
        itemRow: row,
        stockRow: row.product_id ? inventoryStockMap.get(row.product_id) ?? null : null,
        productRow: row.product_id ? productInventoryMap.get(row.product_id) ?? null : null,
        usageHistory: usageHistoryMap.get(row.id) ?? [],
      }),
    }),
  );

  return mapJobOrderDetail({
    row: jobOrderRow,
    customerName: customerMap.get(jobOrderRow.customer_id) ?? "Unknown customer",
    vehicleLabel: vehicleMap.get(jobOrderRow.vehicle_id) ?? "Unknown vehicle",
    quotationNumber: jobOrderRow.quotation_id
      ? quotationMap.get(jobOrderRow.quotation_id) ?? null
      : null,
    invoice: (invoice as InvoiceSummaryRow | null) ?? null,
    settings: (settings as BusinessSettingsRow | null) ?? null,
    items: itemDetails,
    mechanics: mechanicRows.map((row) =>
      mapJobOrderMechanicRowToAssignment(
        row,
        staffMap.get(row.staff_id) ?? "Unknown mechanic",
      ),
    ),
    canUpdateChecklistRole: context.capabilities.includes("job_orders:write"),
    canUpdateStatusRole: context.capabilities.includes("job_orders:write"),
    canManageBillingRole: context.capabilities.includes("invoices:write"),
  });
});

export const getJobOrderMechanicOptions = cache(async (): Promise<JobOrderMechanicOption[]> => {
  const { branchScope, supabase } = await getBranchScopedServerClient("job_orders:write");
  const { data: mechanics, error } = await applyBranchFilter(
    supabase
      .from("staff")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .eq("role", "mechanic")
      .order("last_name", { ascending: true }),
    branchScope.selectedBranchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  return ((mechanics ?? []) as StaffRow[]).map(mapStaffRowToMechanicOption);
});

export const getJobOrderItemCatalogOptions = cache(async (): Promise<{
  products: JobOrderFormOptions["products"];
  services: JobOrderFormOptions["services"];
  permissions: JobOrderFormOptions["permissions"];
  productFormOptions: ProductFormOptionsData | null;
}> => {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("job_orders:write");
  const canCreateProducts = context.capabilities.includes("products:write");
  const { data: catalogSettings, error: catalogSettingsError } = await (supabase as any)
    .from("business_settings")
    .select("allow_global_product_catalog, allow_global_service_catalog")
    .eq("branch_id", branchScope.selectedBranchId)
    .maybeSingle();

  if (catalogSettingsError) {
    throw new Error(catalogSettingsError.message);
  }

  const sharingSettings = {
    allowGlobalProductCatalog: catalogSettings?.allow_global_product_catalog ?? false,
    allowGlobalServiceCatalog: catalogSettings?.allow_global_service_catalog ?? false,
  };
  const [{ data: products, error: productsError }, { data: services, error: servicesError }, productFormOptions] =
    await Promise.all([
      applyCatalogVisibilityFilter(
        supabase
          .from("products")
          .select("id, name, sku, selling_price")
          .eq("status", "active")
          .order("name", { ascending: true }),
        {
          branchId: branchScope.selectedBranchId,
          includeGlobal: sharingSettings.allowGlobalProductCatalog,
        },
      ),
      applyCatalogVisibilityFilter(
        supabase
          .from("services")
          .select("id, name, category, labor_price")
          .eq("status", "active")
          .order("name", { ascending: true }),
        {
          branchId: branchScope.selectedBranchId,
          includeGlobal: sharingSettings.allowGlobalServiceCatalog,
        },
      ),
      canCreateProducts ? getProductFormOptions() : Promise.resolve(null),
    ]);

  if (productsError) {
    throw new Error(productsError.message);
  }

  if (servicesError) {
    throw new Error(servicesError.message);
  }

  return {
    products: ((products ?? []) as ProductRow[]).map(mapProductRowToJobOrderOption),
    services: ((services ?? []) as ServiceRow[]).map(mapServiceRowToJobOrderOption),
    permissions: {
      canCreateProducts,
      canCreateServices: context.capabilities.includes("services:write"),
    },
    productFormOptions,
  };
});

export async function getJobOrderFormOptions(): Promise<JobOrderFormOptions> {
  const [mechanics, catalog] = await Promise.all([
    getJobOrderMechanicOptions(),
    getJobOrderItemCatalogOptions(),
  ]);

  return {
    mechanics,
    products: catalog.products,
    services: catalog.services,
    permissions: catalog.permissions,
  };
}

async function getJobOrderItemsMap(jobOrderIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const rows = await fetchRowsByIdsInChunks<JobOrderItemRow>({
    ids: jobOrderIds,
    fetchChunk: async (chunk) =>
      supabase
        .from("job_order_items")
        .select(
          "id, job_order_id, source_quotation_item_id, line_number, item_type, product_id, service_id, description, quantity, unit_price, total, is_additional, approval_status, usage_status, checklist_completed, checklist_checked_at, checklist_checked_by_staff_id, approved_at, rejected_at, created_at, updated_at",
        )
        .in("job_order_id", chunk)
        .order("line_number", { ascending: true }),
  });

  const map = new Map<string, JobOrderItemDetail[]>();

  for (const row of rows) {
    const currentItems = map.get(row.job_order_id) ?? [];
    currentItems.push(mapJobOrderItemRowToDetail({ row }));
    map.set(row.job_order_id, currentItems);
  }

  return map;
}

async function getInvoicedJobOrderIdSet(jobOrderIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const rows = await fetchRowsByIdsInChunks<{ job_order_id: string | null }>({
    ids: jobOrderIds,
    fetchChunk: async (chunk) =>
      supabase
        .from("invoices")
        .select("job_order_id")
        .in("job_order_id", chunk)
        .neq("status", "cancelled"),
  });

  return new Set(
    rows
      .map((row) => row.job_order_id)
      .filter((jobOrderId): jobOrderId is string => Boolean(jobOrderId)),
  );
}

async function getMechanicCountMap(jobOrderIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const rows = await fetchRowsByIdsInChunks<Pick<JobOrderMechanicRow, "id" | "job_order_id">>({
    ids: jobOrderIds,
    fetchChunk: async (chunk) =>
      supabase.from("job_order_mechanics").select("id, job_order_id").in("job_order_id", chunk),
  });

  const map = new Map<string, number>();

  for (const row of rows) {
    map.set(row.job_order_id, (map.get(row.job_order_id) ?? 0) + 1);
  }

  return map;
}

async function getCustomerNameMap(customerIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const rows = await fetchRowsByIdsInChunks<CustomerRow>({
    ids: customerIds,
    fetchChunk: async (chunk) =>
      supabase.from("customers").select("id, display_name").in("id", chunk),
  });

  return new Map(rows.map((row) => [row.id, row.display_name]));
}

async function getVehicleLabelMap(vehicleIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const rows = await fetchRowsByIdsInChunks<VehicleLabelRow>({
    ids: vehicleIds,
    fetchChunk: async (chunk) =>
      supabase.from("vehicles").select("id, make, model, year, plate_number").in("id", chunk),
  });

  return new Map(rows.map((vehicle) => [vehicle.id, formatVehicleLabel(vehicle)]));
}

async function getQuotationNumberMap(quotationIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const rows = await fetchRowsByIdsInChunks<QuotationRow>({
    ids: quotationIds,
    fetchChunk: async (chunk) =>
      supabase.from("quotations").select("id, quotation_number").in("id", chunk),
  });

  return new Map(rows.map((row) => [row.id, row.quotation_number]));
}

async function getStaffNameMap(staffIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const rows = await fetchRowsByIdsInChunks<StaffRow>({
    ids: staffIds,
    fetchChunk: async (chunk) =>
      supabase.from("staff").select("id, first_name, last_name").in("id", chunk),
  });

  return new Map(
    rows.map((row) => {
      const option = mapStaffRowToMechanicOption(row);
      return [option.id, option.label];
    }),
  );
}

async function getInventoryStockMap(branchId: string, productIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const rows = await fetchRowsByIdsInChunks<InventoryStockRow>({
    ids: productIds,
    fetchChunk: async (chunk) =>
      supabase
        .from("inventory_stocks")
        .select("product_id, quantity_on_hand, available_quantity, reorder_level, shelf_location")
        .eq("branch_id", branchId)
        .in("product_id", chunk),
  });

  return new Map(rows.map((row) => [row.product_id, row]));
}

async function getProductInventoryMap(productIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const rows = await fetchRowsByIdsInChunks<ProductInventoryRow>({
    ids: productIds,
    fetchChunk: async (chunk) =>
      supabase.from("products").select("id, reorder_level, shelf_location").in("id", chunk),
  });

  return new Map(rows.map((row) => [row.id, row]));
}

async function getStockMovementMap(stockMovementIds: string[]) {
  const supabase = await getSupabaseServerClient();
  const rows = await fetchRowsByIdsInChunks<StockMovementRow>({
    ids: stockMovementIds,
    fetchChunk: async (chunk) =>
      supabase.from("stock_movements").select("id, previous_quantity, new_quantity").in("id", chunk),
  });

  return new Map(rows.map((row) => [row.id, row]));
}

async function fetchRowsByIdsInChunks<T>(params: {
  ids: string[];
  fetchChunk: (
    chunk: string[],
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
}): Promise<T[]> {
  if (params.ids.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(params.ids)];
  const chunks: string[][] = [];

  for (let index = 0; index < uniqueIds.length; index += IN_QUERY_CHUNK_SIZE) {
    chunks.push(uniqueIds.slice(index, index + IN_QUERY_CHUNK_SIZE));
  }

  const settled = await Promise.all(
    chunks.map(async (chunk) => {
      const { data, error } = await params.fetchChunk(chunk);
      if (error) {
        throw new Error(toReadableQueryError(error.message));
      }
      return (data ?? []) as T[];
    }),
  );

  return settled.flat();
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}

function formatVehicleLabel(vehicle: VehicleLabelRow) {
  const platePart = vehicle.plate_number ? ` · ${vehicle.plate_number}` : "";
  const yearPart = vehicle.year ? ` (${vehicle.year})` : "";
  return `${vehicle.make} ${vehicle.model}${yearPart}${platePart}`;
}

function resolveRelatedDisplayName(
  value: JobOrderListRow["customers"],
): string | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0]?.display_name ?? null;
  }

  return value.display_name || null;
}

function resolveRelatedVehicleLabel(
  value: JobOrderListRow["vehicles"],
): string | null {
  if (!value) {
    return null;
  }

  const vehicle = Array.isArray(value) ? value[0] : value;
  return vehicle ? formatVehicleLabel({ id: "", ...vehicle }) : null;
}

function resolveRelatedQuotationNumber(
  value: JobOrderListRow["quotations"],
): string | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0]?.quotation_number ?? null;
  }

  return value.quotation_number || null;
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
