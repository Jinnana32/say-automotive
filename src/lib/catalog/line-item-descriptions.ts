import { z, type RefinementCtx } from "zod";

import { getBranchScopedServerClient } from "@/lib/branches";

type CatalogLineItemType = "product" | "service" | "labor";

type CatalogLineItemInput = {
  itemType: CatalogLineItemType;
  description: string;
  productId?: string;
  serviceId?: string;
};

type CatalogLookupClient = Awaited<
  ReturnType<typeof getBranchScopedServerClient>
>["supabase"];

export function refineCatalogLineItemDescription(
  value: CatalogLineItemInput,
  ctx: RefinementCtx,
) {
  if (value.itemType === "labor" && !value.description.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["description"],
      message: "Description is required for labor line items.",
    });
  }
}

export function resolveLineItemDescriptionFromMaps(
  item: CatalogLineItemInput,
  productLabels: ReadonlyMap<string, string>,
  serviceLabels: ReadonlyMap<string, string>,
) {
  const trimmed = item.description.trim();

  if (trimmed) {
    return trimmed;
  }

  if (item.itemType === "product" && item.productId) {
    return productLabels.get(item.productId)?.trim() ?? "";
  }

  if (item.itemType === "service" && item.serviceId) {
    return serviceLabels.get(item.serviceId)?.trim() ?? "";
  }

  return "";
}

export async function fetchCatalogLineItemLabelMaps(
  supabase: CatalogLookupClient,
  productIds: string[],
  serviceIds: string[],
) {
  const [productsResult, servicesResult] = await Promise.all([
    productIds.length > 0
      ? supabase.from("products").select("id, name").in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
    serviceIds.length > 0
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsResult.error) {
    throw new Error(productsResult.error.message);
  }

  if (servicesResult.error) {
    throw new Error(servicesResult.error.message);
  }

  return {
    productLabels: new Map(
      ((productsResult.data ?? []) as Array<{ id: string; name: string }>).map(
        (row) => [row.id, row.name] as const,
      ),
    ),
    serviceLabels: new Map(
      ((servicesResult.data ?? []) as Array<{ id: string; name: string }>).map(
        (row) => [row.id, row.name] as const,
      ),
    ),
  };
}

export async function resolveCatalogLineItemDescription(
  supabase: CatalogLookupClient,
  item: CatalogLineItemInput,
) {
  const trimmed = item.description.trim();

  if (trimmed) {
    return trimmed;
  }

  const productIds =
    item.itemType === "product" && item.productId ? [item.productId] : [];
  const serviceIds =
    item.itemType === "service" && item.serviceId ? [item.serviceId] : [];

  const { productLabels, serviceLabels } = await fetchCatalogLineItemLabelMaps(
    supabase,
    productIds,
    serviceIds,
  );

  return resolveLineItemDescriptionFromMaps(item, productLabels, serviceLabels);
}
