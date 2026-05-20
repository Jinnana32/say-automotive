"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getBranchScopedServerClient } from "@/lib/branches";
import {
  BUSINESS_ASSETS_BUCKET,
  buildProductImageObjectKey,
} from "@/lib/constants/storage";
import {
  INITIAL_FORM_ACTION_STATE,
  toFormActionState,
  type FormActionState,
} from "@/lib/forms";
import { resolveProductImageUrl } from "@/lib/storage";
import {
  parseProductFormData,
  productFormSchema,
} from "@/features/products/schemas/product-form-schema";
import {
  type InlineProductActionState,
  INITIAL_INLINE_PRODUCT_ACTION_STATE,
} from "@/features/products/inline-product-action-state";
import type {
  ProductInlineCreateResult,
  ProductStatus,
  ProductType,
} from "@/features/products/types";

type ProductUnitRow = {
  id: string;
  name: string;
  abbreviation: string;
};

type PersistedProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit_id: string;
  product_type: ProductType;
  selling_price: number;
  cost_price: number;
  reorder_level: number;
  shelf_location: string | null;
  product_image_path: string | null;
  product_image_url: string | null;
  website_image_url: string | null;
  updated_at: string;
};

export async function createProductAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const result = await upsertProduct(formData);

  if (!result.success) {
    return result.state;
  }

  revalidateProductPaths();
  redirect("/products");
}

export async function updateProductAction(
  _prevState: FormActionState = INITIAL_FORM_ACTION_STATE,
  formData: FormData,
): Promise<FormActionState> {
  const result = await upsertProduct(formData);

  if (!result.success) {
    return result.state;
  }

  revalidateProductPaths();
  redirect("/products");
}

export async function createInlineProductAction(
  _prevState: InlineProductActionState = INITIAL_INLINE_PRODUCT_ACTION_STATE,
  formData: FormData,
): Promise<InlineProductActionState> {
  const result = await upsertProduct(formData);

  if (!result.success) {
    return {
      status: "error",
      message: result.state.message,
      fieldErrors: result.state.fieldErrors,
    };
  }

  revalidateProductPaths();

  return {
    status: "success",
    message: `${result.product.label} was added to the catalog.`,
    product: result.product,
  };
}

async function upsertProduct(
  formData: FormData,
): Promise<
  | { success: true; product: ProductInlineCreateResult }
  | { success: false; state: FormActionState }
> {
  const parsed = productFormSchema.safeParse(parseProductFormData(formData));

  if (!parsed.success) {
    return {
      success: false,
      state: toFormActionState(parsed.error),
    };
  }

  const values = parsed.data;
  const { supabase } = await getBranchScopedServerClient("products:write");
  const productId = values.productId ?? randomUUID();
  const productImageFile = readFile(formData, "productImage");
  const productImageValidationError = validateProductImageFile(productImageFile);

  if (productImageValidationError) {
    return {
      success: false,
      state: {
        status: "error",
        message: productImageValidationError,
        fieldErrors: {
          productImageUrl: [productImageValidationError],
        },
      },
    };
  }

  const normalizedSku = normalizeNullableUpper(values.sku);
  const normalizedBarcode = normalizeNullableUpper(values.barcode);
  const normalizedWebsiteSlug =
    values.websiteVisible || values.websiteSlug.trim()
      ? buildWebsiteSlug(values.websiteSlug || values.name)
      : null;
  const normalizedProductImageUrl = normalizeNullable(values.productImageUrl);

  const [
    currentProductResult,
    unitResult,
    skuConflict,
    barcodeConflict,
    websiteSlugConflict,
  ] = await Promise.all([
    values.productId
      ? supabase
          .from("products")
          .select("id, product_image_path, product_image_url")
          .eq("id", values.productId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("units")
      .select("id, name, abbreviation")
      .eq("id", values.unitId)
      .maybeSingle(),
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

  if (currentProductResult.error) {
    return { success: false, state: { status: "error", message: currentProductResult.error.message } };
  }

  if (values.productId && !currentProductResult.data) {
    return { success: false, state: { status: "error", message: "Product does not exist." } };
  }

  if (unitResult.error) {
    return { success: false, state: { status: "error", message: unitResult.error.message } };
  }

  if (!unitResult.data) {
    return {
      success: false,
      state: {
        status: "error",
        message: "Unit is required.",
        fieldErrors: {
          unitId: ["Unit is required."],
        },
      },
    };
  }

  if (skuConflict.error) {
    return { success: false, state: { status: "error", message: skuConflict.error.message } };
  }

  if (barcodeConflict.error) {
    return { success: false, state: { status: "error", message: barcodeConflict.error.message } };
  }

  if (websiteSlugConflict.error) {
    return {
      success: false,
      state: { status: "error", message: websiteSlugConflict.error.message },
    };
  }

  if (skuConflict.data) {
    return {
      success: false,
      state: {
        status: "error",
        message: "A product with this SKU already exists.",
        fieldErrors: {
          sku: ["A product with this SKU already exists."],
        },
      },
    };
  }

  if (barcodeConflict.data) {
    return {
      success: false,
      state: {
        status: "error",
        message: "A product with this barcode already exists.",
        fieldErrors: {
          barcode: ["A product with this barcode already exists."],
        },
      },
    };
  }

  if (websiteSlugConflict.data) {
    return {
      success: false,
      state: {
        status: "error",
        message: "Another product already uses this website slug.",
        fieldErrors: {
          websiteSlug: ["Another product already uses this website slug."],
        },
      },
    };
  }

  let productImagePath =
    (currentProductResult.data as { product_image_path: string | null } | null)
      ?.product_image_path ?? null;
  let productImageUrl = normalizedProductImageUrl;
  let uploadedImagePath: string | null = null;

  if (productImageUrl) {
    productImagePath = null;
  }

  if (productImageFile) {
    uploadedImagePath = buildProductImageObjectKey(productId, productImageFile.name);
    const { error: uploadError } = await supabase.storage
      .from(BUSINESS_ASSETS_BUCKET)
      .upload(uploadedImagePath, productImageFile, {
        contentType: productImageFile.type,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, state: { status: "error", message: uploadError.message } };
    }

    productImagePath = uploadedImagePath;
    productImageUrl = null;
  }

  const payload = {
    id: productId,
    branch_id: null,
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
    warranty_duration_days: values.warrantyDurationDays
      ? Number(values.warrantyDurationDays)
      : null,
    shelf_location: normalizeNullable(values.shelfLocation),
    product_image_path: productImagePath,
    product_image_url: productImageUrl,
    website_visible: values.websiteVisible,
    website_featured: values.websiteVisible ? values.websiteFeatured : false,
    website_sort_order: Number(values.websiteSortOrder),
    website_slug: normalizedWebsiteSlug,
    website_image_url: normalizeNullable(values.websiteImageUrl),
    website_short_description: normalizeNullable(values.websiteShortDescription),
    website_badge: normalizeNullable(values.websiteBadge),
    status: values.status as ProductStatus,
  };

  const operation = values.productId
    ? supabase
        .from("products")
        .update(payload)
        .eq("id", values.productId)
        .select(
          "id, name, sku, barcode, unit_id, product_type, selling_price, cost_price, reorder_level, shelf_location, product_image_path, product_image_url, website_image_url, updated_at",
        )
        .single()
    : supabase
        .from("products")
        .insert(payload)
        .select(
          "id, name, sku, barcode, unit_id, product_type, selling_price, cost_price, reorder_level, shelf_location, product_image_path, product_image_url, website_image_url, updated_at",
        )
        .single();

  const { data, error } = await operation;

  if (error) {
    await removeUploadedProductImage(supabase, uploadedImagePath);
    return { success: false, state: { status: "error", message: error.message } };
  }

  const unit = unitResult.data as ProductUnitRow;
  const savedProduct = data as PersistedProductRow;

  return {
    success: true,
    product: {
      id: savedProduct.id,
      label: savedProduct.name,
      sku: savedProduct.sku,
      barcode: savedProduct.barcode,
      productType: savedProduct.product_type,
      unitLabel: `${unit.name} (${unit.abbreviation})`,
      unitPrice: savedProduct.selling_price,
      costPrice: savedProduct.cost_price,
      reorderLevel: savedProduct.reorder_level,
      shelfLocation: savedProduct.shelf_location,
      productImageUrl: resolveProductImageUrl({
        productImagePath: savedProduct.product_image_path,
        productImageUrl: savedProduct.product_image_url,
        websiteImageUrl: savedProduct.website_image_url,
        cacheBust: savedProduct.updated_at,
      }),
    },
  };
}

function revalidateProductPaths() {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/inventory");
  revalidatePath("/job-orders");
  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/quotations");
}

async function removeUploadedProductImage(
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"],
  uploadPath: string | null,
) {
  if (!uploadPath) {
    return;
  }

  await supabase.storage.from(BUSINESS_ASSETS_BUCKET).remove([uploadPath]);
}

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function validateProductImageFile(file: File | null) {
  if (!file) {
    return null;
  }

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

  if (!allowedTypes.has(file.type)) {
    return "Product photo must be a JPG, PNG, or WEBP image.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Product photo must be 5 MB or smaller.";
  }

  return null;
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
