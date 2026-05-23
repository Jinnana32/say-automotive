import { cache } from "react";

import {
  buildBrandMap,
  buildCategoryMap,
  buildUnitMap,
} from "@/features/products/mappers";
import type { ProductType } from "@/features/products/types";
import type {
  WebsiteCatalogProduct,
  WebsitePostFormValues,
  WebsitePostListItem,
  WebsiteQuoteFormOptionData,
  WebsiteQuoteRequestListItem,
  WebsiteQuoteRequestStatus,
  WebsiteShellData,
} from "@/features/website/types";
import {
  isUuidLike,
  resolveWebsiteProductRouteSegment,
} from "@/features/website/utils";
import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildBusinessLogoUrl, resolveProductImageUrl } from "@/lib/storage";
import type { TableRow } from "@/types/database";

type ProductRow = TableRow<"products">;
type CategoryRow = TableRow<"product_categories">;
type BrandRow = TableRow<"brands">;
type UnitRow = TableRow<"units">;
type WebsitePostRow = TableRow<"website_posts">;
type WebsiteQuoteRequestRow = TableRow<"website_quote_requests">;

const getWebsiteMainBranch = cache(async () => {
  const supabase = getSupabaseAdminClient();
  const { data: branch, error } = await supabase
    .from("branches")
    .select("id, name")
    .eq("is_main", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!branch) {
    throw new Error("Default branch is not configured.");
  }

  return branch;
});

export const getWebsiteShellData = cache(async (): Promise<WebsiteShellData> => {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();

  const { data: settings, error: settingsError } = await supabase
    .from("business_settings")
    .select("business_name, business_address, business_contact, business_email, business_logo_path, updated_at")
    .eq("branch_id", branch.id)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  return {
    businessName: settings?.business_name ?? branch.name,
    businessLogoUrl: buildBusinessLogoUrl(settings?.business_logo_path ?? null, settings?.updated_at ?? null),
    branchName: branch.name,
    address: settings?.business_address ?? null,
    contactNumber: settings?.business_contact ?? null,
    email: settings?.business_email ?? null,
  };
});

export async function listWebsiteCatalogProducts({
  search,
  productType,
}: {
  search?: string;
  productType?: ProductType | "";
} = {}): Promise<WebsiteCatalogProduct[]> {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();
  let query = supabase
    .from("products")
    .select("*")
    .eq("website_visible", true)
    .eq("status", "active")
    .order("website_featured", { ascending: false })
    .order("website_sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (productType) {
    query = query.eq("product_type", productType);
  }

  if (search) {
    const escapedSearch = escapeSearchTerm(search);
    query = query.or(
      `name.ilike.%${escapedSearch}%,website_short_description.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`,
    );
  }

  const [{ data: products, error: productError }, dictionaries] = await Promise.all([
    query,
    getWebsiteReferenceDictionaries(),
  ]);

  if (productError) {
    throw new Error(productError.message);
  }

  return ((products ?? []) as ProductRow[])
    .filter((product) => isPublicWebsiteCatalogRecord(product, branch.id))
    .map((product) =>
    mapProductRowToWebsiteCatalogProduct(product, dictionaries),
    );
}

export async function listFeaturedWebsiteProducts(limitCount = 6) {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();
  const [{ data: products, error: productError }, dictionaries] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("website_visible", true)
      .eq("website_featured", true)
      .eq("status", "active")
      .order("website_sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(limitCount * 3),
    getWebsiteReferenceDictionaries(),
  ]);

  if (productError) {
    throw new Error(productError.message);
  }

  return ((products ?? []) as ProductRow[])
    .filter((product) => isPublicWebsiteCatalogRecord(product, branch.id))
    .slice(0, limitCount)
    .map((product) => mapProductRowToWebsiteCatalogProduct(product, dictionaries));
}

export async function getWebsiteProductBySlug(slug: string) {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();
  const routeSegment = slug.trim();
  const [{ data, error }, dictionaries] = await Promise.all([
    buildWebsiteProductLookupQuery(supabase, routeSegment),
    getWebsiteReferenceDictionaries(),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const matchedProduct =
    ((data ?? []) as ProductRow[]).find((product) =>
      isPublicWebsiteCatalogRecord(product, branch.id),
    ) ?? null;

  if (!matchedProduct) {
    return null;
  }

  return mapProductRowToWebsiteCatalogProduct(matchedProduct, dictionaries);
}

export async function listPublishedWebsitePosts(limitCount?: number): Promise<WebsitePostListItem[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("website_posts")
    .select("*")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (typeof limitCount === "number") {
    query = query.limit(limitCount);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WebsitePostRow[]).map(mapWebsitePostRowToItem);
}

export async function getWebsiteQuoteFormOptions(): Promise<WebsiteQuoteFormOptionData> {
  const supabase = getSupabaseAdminClient();
  const branch = await getWebsiteMainBranch();
  const [
    { data: services, error: servicesError },
    { data: makes, error: makesError },
    { data: models, error: modelsError },
    { data: transmissions, error: transmissionsError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("name, branch_id, is_global")
      .eq("status", "active")
      .order("name", { ascending: true }),
    supabase.from("vehicle_makes").select("id, name").eq("status", "active").order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase
      .from("vehicle_models")
      .select("id, make_id, name")
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("vehicle_lookup_options")
      .select("label")
      .eq("lookup_type", "transmission")
      .eq("status", "active")
      .order("sort_order", { ascending: true }),
  ]);

  if (servicesError || makesError || modelsError || transmissionsError) {
    throw new Error(
      servicesError?.message ??
        makesError?.message ??
        modelsError?.message ??
        transmissionsError?.message ??
        "Unable to load website quote form options.",
    );
  }

  const makesById = new Map(
    ((makes ?? []) as Array<{ id: string; name: string }>).map((make) => [make.id, make.name]),
  );

  return {
    services: ((services ?? []) as Array<{ name: string; branch_id: string; is_global?: boolean }>)
      .filter((service) => isPublicWebsiteCatalogRecord(service, branch.id))
      .map((service) => service.name),
    vehicleMakes: (makes ?? []) as Array<{ id: string; name: string }>,
    vehicleModels: ((models ?? []) as Array<{ id: string; make_id: string; name: string }>).map(
      (model) => ({
        id: model.id,
        makeId: model.make_id,
        makeName: makesById.get(model.make_id) ?? "Unknown make",
        name: model.name,
      }),
    ),
    transmissions: ((transmissions ?? []) as Array<{ label: string }>).map(
      (option) => option.label,
    ),
  };
}

export async function listWebsitePosts(): Promise<WebsitePostListItem[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("settings:read");
  const { data, error } = await supabase
    .from("website_posts")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WebsitePostRow[]).map(mapWebsitePostRowToItem);
}

export async function getWebsitePostById(postId: string): Promise<WebsitePostFormValues | null> {
  const { supabase } = await getAuthorizedSupabaseServerClient("settings:read");
  const { data, error } = await supabase
    .from("website_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    postId: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    coverImageUrl: data.cover_image_url ?? "",
    category: data.category as WebsitePostFormValues["category"],
    isFeatured: data.is_featured,
    status: data.status,
  };
}

export async function listWebsiteQuoteRequests({
  search,
  status,
}: {
  search?: string;
  status?: WebsiteQuoteRequestStatus | "";
} = {}): Promise<WebsiteQuoteRequestListItem[]> {
  const { supabase } = await getAuthorizedSupabaseServerClient("quotations:read");
  let query = supabase
    .from("website_quote_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    const escapedSearch = escapeSearchTerm(search);
    query = query.or(
      `first_name.ilike.%${escapedSearch}%,last_name.ilike.%${escapedSearch}%,contact_number.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,vehicle_make.ilike.%${escapedSearch}%,vehicle_model.ilike.%${escapedSearch}%,city.ilike.%${escapedSearch}%,province.ilike.%${escapedSearch}%,service_needed.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WebsiteQuoteRequestRow[]).map((request) => ({
    id: request.id,
    requestedProductLabel: request.requested_product_label,
    firstName: request.first_name,
    lastName: request.last_name,
    contactNumber: request.contact_number,
    email: request.email,
    province: request.province,
    city: request.city,
    barangay: request.barangay,
    vehicleMake: request.vehicle_make,
    vehicleModel: request.vehicle_model,
    vehicleYear: request.vehicle_year,
    transmission: request.transmission,
    mileage: request.mileage,
    engineSize: request.engine_size,
    oilRequirementLiters: request.oil_requirement_liters,
    serviceNeeded: request.service_needed,
    customerConcern: request.customer_concern,
    status: request.status as WebsiteQuoteRequestStatus,
    createdAt: request.created_at,
    contactedAt: request.contacted_at,
  }));
}

export async function getWebsiteManagementOverview() {
  const { supabase } = await getAuthorizedSupabaseServerClient("settings:read");
  const [
    { count: publishedProducts, error: productsError },
    { count: featuredProducts, error: featuredProductsError },
    { count: activePosts, error: postsError },
    { count: newRequests, error: requestsError },
    { data: recentPosts, error: recentPostsError },
    { data: recentRequests, error: recentRequestsError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("website_visible", true),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("website_visible", true)
      .eq("website_featured", true),
    supabase
      .from("website_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("website_quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("website_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("website_quote_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (
    productsError ||
    featuredProductsError ||
    postsError ||
    requestsError ||
    recentPostsError ||
    recentRequestsError
  ) {
    throw new Error(
      productsError?.message ??
        featuredProductsError?.message ??
        postsError?.message ??
        requestsError?.message ??
        recentPostsError?.message ??
        recentRequestsError?.message ??
        "Unable to load website management data.",
    );
  }

  return {
    publishedProducts: publishedProducts ?? 0,
    featuredProducts: featuredProducts ?? 0,
    activePosts: activePosts ?? 0,
    newRequests: newRequests ?? 0,
    recentPosts: ((recentPosts ?? []) as WebsitePostRow[]).map(mapWebsitePostRowToItem),
    recentRequests: ((recentRequests ?? []) as WebsiteQuoteRequestRow[]).map((request) => ({
      id: request.id,
      requestedProductLabel: request.requested_product_label,
      firstName: request.first_name,
      lastName: request.last_name,
      contactNumber: request.contact_number,
      email: request.email,
      province: request.province,
      city: request.city,
      barangay: request.barangay,
      vehicleMake: request.vehicle_make,
      vehicleModel: request.vehicle_model,
      vehicleYear: request.vehicle_year,
      transmission: request.transmission,
      mileage: request.mileage,
      engineSize: request.engine_size,
      oilRequirementLiters: request.oil_requirement_liters,
      serviceNeeded: request.service_needed,
      customerConcern: request.customer_concern,
      status: request.status as WebsiteQuoteRequestStatus,
      createdAt: request.created_at,
      contactedAt: request.contacted_at,
    })),
  };
}

const getWebsiteReferenceDictionaries = cache(async () => {
  const supabase = getSupabaseAdminClient();
  const [
    { data: categories, error: categoriesError },
    { data: brands, error: brandsError },
    { data: units, error: unitsError },
  ] = await Promise.all([
    supabase.from("product_categories").select("*").eq("status", "active"),
    supabase.from("brands").select("*").eq("status", "active"),
    supabase.from("units").select("*"),
  ]);

  if (categoriesError || brandsError || unitsError) {
    throw new Error(
      categoriesError?.message ??
        brandsError?.message ??
        unitsError?.message ??
        "Unable to load website reference data.",
    );
  }

  return {
    categories: buildCategoryMap((categories ?? []) as CategoryRow[]),
    brands: buildBrandMap((brands ?? []) as BrandRow[]),
    units: buildUnitMap((units ?? []) as UnitRow[]),
  };
});

function mapProductRowToWebsiteCatalogProduct(
  row: ProductRow,
  dictionaries: {
    categories: Map<string, string>;
    brands: Map<string, string>;
    units: Map<string, string>;
  },
): WebsiteCatalogProduct {
  return {
    id: row.id,
    name: row.name,
    slug: resolveWebsiteProductRouteSegment({
      id: row.id,
      websiteSlug: row.website_slug,
    }),
    productType: row.product_type,
    categoryName: row.category_id ? dictionaries.categories.get(row.category_id) ?? null : null,
    brandName: row.brand_id ? dictionaries.brands.get(row.brand_id) ?? null : null,
    unitLabel: dictionaries.units.get(row.unit_id) ?? "Unit",
    price: row.selling_price,
    badge: row.website_badge,
    shortDescription: row.website_short_description,
    description: row.description,
    imageUrl: resolveProductImageUrl({
      productImagePath: row.product_image_path,
      productImageUrl: row.product_image_url,
      websiteImageUrl: row.website_image_url,
      cacheBust: row.updated_at,
    }),
    isFeatured: row.website_featured,
    sortOrder: row.website_sort_order,
  };
}

function mapWebsitePostRowToItem(row: WebsitePostRow): WebsitePostListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    category: row.category as WebsitePostListItem["category"],
    isFeatured: row.is_featured,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}

function buildWebsiteProductLookupQuery(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  routeSegment: string,
) {
  let query = supabase
    .from("products")
    .select("*")
    .eq("website_visible", true)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(2);

  if (isUuidLike(routeSegment)) {
    const escapedRouteSegment = routeSegment.replaceAll(",", "\\,");
    return query.or(
      `id.eq.${escapedRouteSegment},website_slug.eq.${escapedRouteSegment}`,
    );
  }

  return query.eq("website_slug", routeSegment);
}

function isPublicWebsiteCatalogRecord(
  row: { branch_id: string; is_global?: boolean | null },
  mainBranchId: string,
) {
  return row.branch_id === mainBranchId || row.is_global === true;
}
