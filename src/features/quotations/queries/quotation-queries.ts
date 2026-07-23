import { cache } from "react";

import {
  applyBranchFilter,
  getBranchScopedServerClient,
} from "@/lib/branches";
import {
  applyCatalogVisibilityFilter,
  getCatalogSharingSettings,
} from "@/lib/catalog-visibility";
import { listCustomerOptions } from "@/features/customers/queries/customer-queries";
import { getVehicleFormLookupData } from "@/features/vehicles/queries/vehicle-lookup-queries";
import {
  mapProductRowToQuotationOption,
  mapQuotationDetail,
  mapQuotationRowToListItem,
  mapServiceRowToQuotationOption,
  mapVehicleRowToQuotationOption,
} from "@/features/quotations/mappers";
import { getProductFormOptions } from "@/features/products/queries/product-queries";
import type {
  QuotationCreateFlowOptions,
  QuotationDetail,
  QuotationFormOptions,
  QuotationListItem,
} from "@/features/quotations/types";
import { dedupeOptionsById, mergeQuotationPartiesIntoFormOptions } from "@/features/quotations/utils";
import { mergeQuotationCatalogIntoFormOptions } from "@/features/quotations/line-item-catalog";
import type { QuotationFormItem } from "@/features/quotations/types";
import { buildQuotationSearchOrConditions } from "@/features/quotations/quotation-search";
import type { TableRow } from "@/types/database";

type QuotationRow = TableRow<"quotations">;
type QuotationItemRow = TableRow<"quotation_items">;
type CustomerRow = TableRow<"customers">;
type VehicleRow = TableRow<"vehicles">;
type ProductRow = TableRow<"products">;
type ServiceRow = TableRow<"services">;
type JobOrderRow = TableRow<"job_orders">;
type BusinessSettingsRow = Pick<TableRow<"business_settings">, "default_tax_rate">;

export async function listQuotations(filters?: {
  search?: string;
  status?: QuotationRow["status"] | "";
}): Promise<QuotationListItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("quotations:read");
  let query = applyBranchFilter(
    supabase
    .from("quotations")
    .select("*")
    .order("created_at", { ascending: false }),
    branchScope.selectedBranchId,
  );

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    const orFilter = await buildQuotationSearchOrFilter(
      supabase,
      branchScope.selectedBranchId,
      filters.search,
    );

    if (orFilter) {
      query = query.or(orFilter);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const quotations = (data ?? []) as QuotationRow[];
  const customerIds = [...new Set(quotations.map((row) => row.customer_id))];
  const vehicleIds = [...new Set(quotations.map((row) => row.vehicle_id))];
  const [customerMap, vehicleMap] = await Promise.all([
    getCustomerNameMap(supabase, customerIds),
    getVehicleLabelMap(supabase, vehicleIds),
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
  const { branchScope, supabase } = await getBranchScopedServerClient("quotations:read");

  const [
    { data: quotation, error: quotationError },
    { data: items, error: itemsError },
    { data: jobOrder, error: jobOrderError },
  ] = await Promise.all([
    applyBranchFilter(
      supabase.from("quotations").select("*"),
      branchScope.selectedBranchId,
    )
      .eq("id", quotationId)
      .maybeSingle(),
    supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", quotationId)
      .order("line_number", { ascending: true }),
    applyBranchFilter(
      supabase
      .from("job_orders")
      .select("id, job_order_number")
      .eq("quotation_id", quotationId),
      branchScope.selectedBranchId,
    ).maybeSingle(),
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
    getCustomerNameMap(supabase, [quotation.customer_id]),
    getVehicleLabelMap(supabase, [quotation.vehicle_id]),
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
  const { branchScope, context, supabase } = await getBranchScopedServerClient("quotations:write");
  const branchId = branchScope.selectedBranch?.id ?? branchScope.writeBranchId;
  const sharingSettings = await getCatalogSharingSettings(supabase, branchScope.selectedBranchId);
  const canCreateProducts = context.capabilities.includes("products:write");
  const canCreateServices = context.capabilities.includes("services:write");
  const [
    customers,
    { data: vehicles, error: vehiclesError },
    { data: products, error: productsError },
    { data: services, error: servicesError },
    productFormOptions,
    { data: settings, error: settingsError },
  ] = await Promise.all([
    listCustomerOptions(),
    applyBranchFilter(
      supabase
      .from("vehicles")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
      branchScope.selectedBranchId,
    ),
    applyCatalogVisibilityFilter(
      supabase
      .from("products")
      .select("*")
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
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true }),
      {
        branchId: branchScope.selectedBranchId,
        includeGlobal: sharingSettings.allowGlobalServiceCatalog,
      },
    ),
    canCreateProducts ? getProductFormOptions() : Promise.resolve(null),
    supabase
      .from("business_settings")
      .select("default_tax_rate")
      .eq("branch_id", branchId)
      .maybeSingle(),
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

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  return {
    customers: dedupeOptionsById(customers),
    vehicles: dedupeOptionsById(
      ((vehicles ?? []) as VehicleRow[]).map(mapVehicleRowToQuotationOption),
    ),
    products: dedupeOptionsById(
      ((products ?? []) as ProductRow[]).map(mapProductRowToQuotationOption),
    ),
    services: dedupeOptionsById(
      ((services ?? []) as ServiceRow[]).map(mapServiceRowToQuotationOption),
    ),
    productFormOptions,
    defaultTaxRate: ((settings as BusinessSettingsRow | null)?.default_tax_rate ?? 0),
    permissions: {
      canCreateProducts,
      canCreateServices,
    },
  };
}

export async function getQuotationFormOptionsForQuotation(
  quotation: Pick<QuotationDetail, "customerId" | "customerName" | "vehicleId" | "vehicleLabel">,
  lineItems: Array<Pick<QuotationFormItem, "itemType" | "productId" | "serviceId" | "description" | "unitPrice">> = [],
): Promise<QuotationFormOptions> {
  const { supabase } = await getBranchScopedServerClient("quotations:write");
  const baseOptions = await getQuotationFormOptions();
  const productIds = [
    ...new Set(lineItems.map((item) => item.productId).filter((productId) => productId.trim())),
  ];
  const serviceIds = [
    ...new Set(lineItems.map((item) => item.serviceId).filter((serviceId) => serviceId.trim())),
  ];
  const [
    { data: customer, error: customerError },
    { data: vehicle, error: vehicleError },
    { data: lineProducts, error: lineProductsError },
    { data: lineServices, error: lineServicesError },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, display_name")
      .eq("id", quotation.customerId)
      .maybeSingle(),
    supabase.from("vehicles").select("*").eq("id", quotation.vehicleId).maybeSingle(),
    productIds.length > 0
      ? supabase.from("products").select("*").in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
    serviceIds.length > 0
      ? supabase.from("services").select("*").in("id", serviceIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (vehicleError) {
    throw new Error(vehicleError.message);
  }

  if (lineProductsError) {
    throw new Error(lineProductsError.message);
  }

  if (lineServicesError) {
    throw new Error(lineServicesError.message);
  }

  const mergedParties = mergeQuotationPartiesIntoFormOptions(baseOptions, {
    customerId: quotation.customerId,
    customerName: customer?.display_name?.trim() || quotation.customerName,
    vehicleId: quotation.vehicleId,
    vehicleLabel: vehicle
      ? mapVehicleRowToQuotationOption(vehicle as VehicleRow).label
      : quotation.vehicleLabel,
  });
  const mergedCatalog = mergeQuotationCatalogIntoFormOptions(
    baseOptions,
    lineItems,
    {
      products: ((lineProducts ?? []) as ProductRow[]).map(mapProductRowToQuotationOption),
      services: ((lineServices ?? []) as ServiceRow[]).map(mapServiceRowToQuotationOption),
    },
  );

  return {
    ...baseOptions,
    customers: mergedParties.customers,
    vehicles: mergedParties.vehicles,
    products: mergedCatalog.products,
    services: mergedCatalog.services,
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

async function getCustomerNameMap(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  customerIds: string[],
) {
  if (customerIds.length === 0) {
    return new Map<string, string>();
  }

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

async function getVehicleLabelMap(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  vehicleIds: string[],
) {
  if (vehicleIds.length === 0) {
    return new Map<string, string>();
  }

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

async function buildQuotationSearchOrFilter(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  selectedBranchId: string | null,
  search: string,
) {
  const trimmedSearch = search.trim();

  if (!trimmedSearch) {
    return null;
  }

  const escapedSearch = escapeSearchTerm(trimmedSearch);
  const pattern = `%${escapedSearch}%`;
  const [customersResult, vehiclesResult] = await Promise.all([
    applyBranchFilter(
      supabase.from("customers").select("id").ilike("display_name", pattern),
      selectedBranchId,
    ),
    applyBranchFilter(
      supabase
        .from("vehicles")
        .select("id")
        .or(`make.ilike.${pattern},model.ilike.${pattern},plate_number.ilike.${pattern}`),
      selectedBranchId,
    ),
  ]);

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (vehiclesResult.error) {
    throw new Error(vehiclesResult.error.message);
  }

  return buildQuotationSearchOrConditions({
    search: trimmedSearch,
    customerIds: (customersResult.data ?? []).map((row) => row.id),
    vehicleIds: (vehiclesResult.data ?? []).map((row) => row.id),
  });
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
