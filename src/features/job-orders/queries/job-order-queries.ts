import { cache } from "react";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
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
import { getSupabaseServerClient } from "@/lib/supabase/server";

type JobOrderRow = TableRow<"job_orders">;
type JobOrderItemRow = TableRow<"job_order_items">;
type JobOrderMechanicRow = TableRow<"job_order_mechanics">;
type JobOrderPartUsageRow = TableRow<"job_order_part_usages">;
type CustomerRow = Pick<TableRow<"customers">, "id" | "display_name">;
type VehicleRow = TableRow<"vehicles">;
type QuotationRow = Pick<TableRow<"quotations">, "id" | "quotation_number">;
type InvoiceSummaryRow = Pick<
  TableRow<"invoices">,
  "id" | "invoice_number" | "status" | "total_amount" | "paid_amount" | "balance"
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
  const { supabase } = await getAuthorizedSupabaseServerClient("job_orders:read");
  let query = supabase
    .from("job_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchTerm(filters.search);
    query = query.ilike("job_order_number", `%${escapedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const jobOrders = (data ?? []) as JobOrderRow[];
  const jobOrderIds = jobOrders.map((row) => row.id);
  const customerIds = [...new Set(jobOrders.map((row) => row.customer_id))];
  const vehicleIds = [...new Set(jobOrders.map((row) => row.vehicle_id))];
  const quotationIds = [...new Set(jobOrders.flatMap((row) => (row.quotation_id ? [row.quotation_id] : [])))];

  const [itemsByJobOrderId, mechanicCountMap, customerMap, vehicleMap, quotationMap] = await Promise.all([
    getJobOrderItemsMap(jobOrderIds),
    getMechanicCountMap(jobOrderIds),
    getCustomerNameMap(customerIds),
    getVehicleLabelMap(vehicleIds),
    getQuotationNumberMap(quotationIds),
  ]);

  return jobOrders.map((row) =>
    mapJobOrderRowToListItem({
      row,
      customerName: customerMap.get(row.customer_id) ?? "Unknown customer",
      vehicleLabel: vehicleMap.get(row.vehicle_id) ?? "Unknown vehicle",
      quotationNumber: row.quotation_id ? quotationMap.get(row.quotation_id) ?? null : null,
      assignedMechanicCount: mechanicCountMap.get(row.id) ?? 0,
      items: itemsByJobOrderId.get(row.id) ?? [],
    }),
  );
}

export const getJobOrderById = cache(async (jobOrderId: string): Promise<JobOrderDetail | null> => {
  const { supabase } = await getAuthorizedSupabaseServerClient("job_orders:read");
  const [
    { data: jobOrder, error: jobOrderError },
    { data: items, error: itemsError },
    { data: mechanics, error: mechanicsError },
    { data: usages, error: usagesError },
    { data: invoice, error: invoiceError },
  ] = await Promise.all([
    supabase.from("job_orders").select("*").eq("id", jobOrderId).maybeSingle(),
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
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total_amount, paid_amount, balance")
      .eq("job_order_id", jobOrderId)
      .maybeSingle(),
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
  const itemRows = (items ?? []) as JobOrderItemRow[];
  const mechanicRows = (mechanics ?? []) as JobOrderMechanicRow[];
  const usageRows = (usages ?? []) as JobOrderPartUsageRow[];
  const staffIds = [...new Set(mechanicRows.map((row) => row.staff_id))];
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
    getStaffNameMap(staffIds),
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
    items: itemDetails,
    mechanics: mechanicRows.map((row) =>
      mapJobOrderMechanicRowToAssignment(
        row,
        staffMap.get(row.staff_id) ?? "Unknown mechanic",
      ),
    ),
  });
});

export const getJobOrderMechanicOptions = cache(async (): Promise<JobOrderMechanicOption[]> => {
  const supabase = await getSupabaseServerClient();
  const { data: mechanics, error } = await supabase
    .from("staff")
    .select("id, first_name, last_name")
    .eq("status", "active")
    .eq("role", "mechanic")
    .order("last_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((mechanics ?? []) as StaffRow[]).map(mapStaffRowToMechanicOption);
});

export const getJobOrderItemCatalogOptions = cache(async (): Promise<{
  products: JobOrderFormOptions["products"];
  services: JobOrderFormOptions["services"];
}> => {
  const supabase = await getSupabaseServerClient();
  const [{ data: products, error: productsError }, { data: services, error: servicesError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, sku, selling_price")
        .eq("status", "active")
        .order("name", { ascending: true }),
      supabase
        .from("services")
        .select("id, name, category, labor_price")
        .eq("status", "active")
        .order("name", { ascending: true }),
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
  };
}

async function getJobOrderItemsMap(jobOrderIds: string[]) {
  if (jobOrderIds.length === 0) {
    return new Map<string, JobOrderItemDetail[]>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("job_order_items")
    .select("*")
    .in("job_order_id", jobOrderIds)
    .order("line_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, JobOrderItemDetail[]>();

  for (const row of (data ?? []) as JobOrderItemRow[]) {
    const currentItems = map.get(row.job_order_id) ?? [];
    currentItems.push(mapJobOrderItemRowToDetail({ row }));
    map.set(row.job_order_id, currentItems);
  }

  return map;
}

async function getMechanicCountMap(jobOrderIds: string[]) {
  if (jobOrderIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("job_order_mechanics")
    .select("id, job_order_id")
    .in("job_order_id", jobOrderIds);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, number>();

  for (const row of (data ?? []) as Pick<JobOrderMechanicRow, "id" | "job_order_id">[]) {
    map.set(row.job_order_id, (map.get(row.job_order_id) ?? 0) + 1);
  }

  return map;
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

  return new Map(((data ?? []) as CustomerRow[]).map((row) => [row.id, row.display_name]));
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
      return [vehicle.id, formatVehicleLabel(vehicle)];
    }),
  );
}

async function getQuotationNumberMap(quotationIds: string[]) {
  if (quotationIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("id, quotation_number")
    .in("id", quotationIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as QuotationRow[]).map((row) => [row.id, row.quotation_number]));
}

async function getStaffNameMap(staffIds: string[]) {
  if (staffIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff")
    .select("id, first_name, last_name")
    .in("id", staffIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as StaffRow[]).map((row) => {
      const option = mapStaffRowToMechanicOption(row);
      return [option.id, option.label];
    }),
  );
}

async function getInventoryStockMap(branchId: string, productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, InventoryStockRow>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_stocks")
    .select("product_id, quantity_on_hand, available_quantity, reorder_level, shelf_location")
    .eq("branch_id", branchId)
    .in("product_id", productIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as InventoryStockRow[]).map((row) => [row.product_id, row]),
  );
}

async function getProductInventoryMap(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, ProductInventoryRow>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, reorder_level, shelf_location")
    .in("id", productIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as ProductInventoryRow[]).map((row) => [row.id, row]),
  );
}

async function getStockMovementMap(stockMovementIds: string[]) {
  if (stockMovementIds.length === 0) {
    return new Map<string, StockMovementRow>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("id, previous_quantity, new_quantity")
    .in("id", stockMovementIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as StockMovementRow[]).map((row) => [row.id, row]),
  );
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}

function formatVehicleLabel(vehicle: VehicleRow) {
  const platePart = vehicle.plate_number ? ` · ${vehicle.plate_number}` : "";
  const yearPart = vehicle.year ? ` (${vehicle.year})` : "";
  return `${vehicle.make} ${vehicle.model}${yearPart}${platePart}`;
}
