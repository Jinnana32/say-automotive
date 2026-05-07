"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAuthorizedSupabaseServerClient } from "@/lib/auth/session";
import { getDefaultBranch } from "@/lib/branches";
import { INITIAL_FORM_ACTION_STATE, toFormActionState, type FormActionState } from "@/lib/forms";
import { parseProductFormData, productFormSchema } from "@/features/products/schemas/product-form-schema";

export async function createProductAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveProduct(formData);
}

export async function updateProductAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  return saveProduct(formData);
}

async function saveProduct(formData: FormData): Promise<FormActionState> {
  const parsed = productFormSchema.safeParse(parseProductFormData(formData));

  if (!parsed.success) {
    return toFormActionState(parsed.error);
  }

  const values = parsed.data;
  const [{ id: branchId }, { supabase }] = await Promise.all([
    getDefaultBranch(),
    getAuthorizedSupabaseServerClient("products:write"),
  ]);

  const normalizedSku = normalizeNullableUpper(values.sku);
  const normalizedBarcode = normalizeNullableUpper(values.barcode);
  const normalizedWebsiteSlug =
    values.websiteVisible || values.websiteSlug.trim()
      ? buildWebsiteSlug(values.websiteSlug || values.name)
      : null;

  const [skuConflict, barcodeConflict, websiteSlugConflict] = await Promise.all([
    normalizedSku
      ? supabase
          .from("products")
          .select("id")
          .eq("sku", normalizedSku)
          .neq("id", values.productId ?? "")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    normalizedBarcode
      ? supabase
          .from("products")
          .select("id")
          .eq("barcode", normalizedBarcode)
          .neq("id", values.productId ?? "")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    normalizedWebsiteSlug
      ? supabase
          .from("products")
          .select("id")
          .eq("website_slug", normalizedWebsiteSlug)
          .neq("id", values.productId ?? "")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (skuConflict.error) {
    return { status: "error", message: skuConflict.error.message };
  }

  if (barcodeConflict.error) {
    return { status: "error", message: barcodeConflict.error.message };
  }

  if (websiteSlugConflict.error) {
    return { status: "error", message: websiteSlugConflict.error.message };
  }

  if (skuConflict.data) {
    return {
      status: "error",
      message: "A product with this SKU already exists.",
      fieldErrors: {
        sku: ["A product with this SKU already exists."],
      },
    };
  }

  if (barcodeConflict.data) {
    return {
      status: "error",
      message: "A product with this barcode already exists.",
      fieldErrors: {
        barcode: ["A product with this barcode already exists."],
      },
    };
  }

  if (websiteSlugConflict.data) {
    return {
      status: "error",
      message: "Another product already uses this website slug.",
      fieldErrors: {
        websiteSlug: ["Another product already uses this website slug."],
      },
    };
  }

  const payload = {
    branch_id: branchId,
    name: values.name,
    sku: normalizedSku,
    barcode: normalizedBarcode,
    category_id: normalizeUuid(values.categoryId),
    brand_id: normalizeUuid(values.brandId),
    primary_supplier_id: normalizeUuid(values.supplierId),
    unit_id: values.unitId,
    part_number: normalizeNullable(values.partNumber),
    oem_number: normalizeNullable(values.oemNumber),
    description: normalizeNullable(values.description),
    product_type: values.productType,
    cost_price: Number(values.costPrice),
    selling_price: Number(values.sellingPrice),
    reorder_level: Number(values.reorderLevel),
    warranty_duration_days: values.warrantyDurationDays ? Number(values.warrantyDurationDays) : null,
    shelf_location: normalizeNullable(values.shelfLocation),
    website_visible: values.websiteVisible,
    website_featured: values.websiteVisible ? values.websiteFeatured : false,
    website_sort_order: Number(values.websiteSortOrder),
    website_slug: normalizedWebsiteSlug,
    website_image_url: normalizeNullable(values.websiteImageUrl),
    website_short_description: normalizeNullable(values.websiteShortDescription),
    website_badge: normalizeNullable(values.websiteBadge),
    status: values.status,
  };

  const operation = values.productId
    ? supabase.from("products").update(payload).eq("id", values.productId).select("id").single()
    : supabase.from("products").insert(payload).select("id").single();

  const { error } = await operation;

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/");
  revalidatePath("/catalog");
  redirect("/products");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeNullableUpper(value: string) {
  const trimmed = value.trim().toUpperCase();
  return trimmed ? trimmed : null;
}

function normalizeUuid(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function buildWebsiteSlug(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || null;
}
