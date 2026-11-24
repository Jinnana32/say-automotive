"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import {
  canMarkCatalogRecordGlobal,
  canSelectCatalogOwningBranch,
  resolveCatalogWriteBranchId,
} from "@/lib/catalog-visibility";
import { getBranchScopedServerClient } from "@/lib/branches";
import {
  INITIAL_PRODUCT_CSV_IMPORT_STATE,
  type ProductCsvImportRowResult,
  type ProductCsvImportState,
} from "@/features/products/product-csv-import-state";
import {
  parseProductCsvText,
  type ParsedProductCsvRow,
  type ProductCsvRowValues,
} from "@/features/products/schemas/product-csv-import";

export async function importProductsFromCsvAction(
  _prevState: ProductCsvImportState = INITIAL_PRODUCT_CSV_IMPORT_STATE,
  formData: FormData,
): Promise<ProductCsvImportState> {
  const csvRead = await readCsvText(formData);

  if (csvRead.error) {
    return {
      ...INITIAL_PRODUCT_CSV_IMPORT_STATE,
      status: "error",
      message: csvRead.error,
    };
  }

  const csvText = csvRead.text.trim();

  if (!csvText) {
    return {
      ...INITIAL_PRODUCT_CSV_IMPORT_STATE,
      status: "error",
      message: "Choose a CSV file to import.",
    };
  }

  const parsed = parseProductCsvText(csvText);

  if (parsed.fatalError) {
    return {
      ...INITIAL_PRODUCT_CSV_IMPORT_STATE,
      status: "error",
      message: parsed.fatalError,
    };
  }

  const { branchScope, context, supabase } = await getBranchScopedServerClient("products:write");
  const canMarkGlobal = canMarkCatalogRecordGlobal(context.role);
  const canSelectOwningBranch = canSelectCatalogOwningBranch({
    role: context.role,
    accessibleBranchCount: branchScope.accessibleBranches.length,
  });
  const branchId = resolveCatalogWriteBranchId({
    requestedBranchId: branchScope.writeBranchId,
    writeBranchId: branchScope.writeBranchId,
    canSelectOwningBranch,
    accessibleBranchIds: branchScope.accessibleBranches.map((branch) => branch.id),
  });

  const [
    { data: units, error: unitsError },
    { data: categories, error: categoriesError },
    { data: brands, error: brandsError },
    { data: suppliers, error: suppliersError },
    { data: existingProducts, error: existingError },
  ] = await Promise.all([
    supabase.from("units").select("id, name, abbreviation"),
    supabase.from("product_categories").select("id, name").eq("status", "active"),
    supabase.from("brands").select("id, name").eq("status", "active"),
    supabase.from("suppliers").select("id, supplier_name").eq("status", "active"),
    supabase.from("products").select("sku, barcode").eq("branch_id", branchId),
  ]);

  if (unitsError || categoriesError || brandsError || suppliersError || existingError) {
    return {
      ...INITIAL_PRODUCT_CSV_IMPORT_STATE,
      status: "error",
      message:
        unitsError?.message ||
        categoriesError?.message ||
        brandsError?.message ||
        suppliersError?.message ||
        existingError?.message ||
        "Could not load catalog references for import.",
    };
  }

  const unitByKey = buildLookupMap(
    (units ?? []).map((unit) => ({
      id: unit.id,
      keys: [unit.name, unit.abbreviation],
    })),
  );
  const categoryByKey = buildLookupMap(
    (categories ?? []).map((category) => ({ id: category.id, keys: [category.name] })),
  );
  const brandByKey = buildLookupMap(
    (brands ?? []).map((brand) => ({ id: brand.id, keys: [brand.name] })),
  );
  const supplierByKey = buildLookupMap(
    (suppliers ?? []).map((supplier) => ({
      id: supplier.id,
      keys: [supplier.supplier_name],
    })),
  );

  const existingSkus = new Set(
    (existingProducts ?? [])
      .map((product) => product.sku?.trim().toUpperCase())
      .filter((value): value is string => Boolean(value)),
  );
  const existingBarcodes = new Set(
    (existingProducts ?? [])
      .map((product) => product.barcode?.trim().toUpperCase())
      .filter((value): value is string => Boolean(value)),
  );

  const seenSkus = new Set<string>();
  const seenBarcodes = new Set<string>();
  const results: ProductCsvImportRowResult[] = [];
  let createdCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const row of parsed.rows) {
    const outcome = await importOneRow({
      row,
      branchId,
      canMarkGlobal,
      unitByKey,
      categoryByKey,
      brandByKey,
      supplierByKey,
      existingSkus,
      existingBarcodes,
      seenSkus,
      seenBarcodes,
      supabase,
    });

    results.push(outcome);

    if (outcome.status === "created") {
      createdCount += 1;
    } else if (outcome.status === "skipped") {
      skippedCount += 1;
    } else {
      failedCount += 1;
    }
  }

  if (createdCount > 0) {
    revalidatePath("/products");
    revalidatePath("/catalog");
    revalidatePath("/inventory");
    revalidatePath("/pos");
    revalidatePath("/quotations");
    revalidatePath("/job-orders");
  }

  const message =
    failedCount === 0 && skippedCount === 0
      ? `Imported ${createdCount} product${createdCount === 1 ? "" : "s"}.`
      : `Imported ${createdCount}, skipped ${skippedCount}, failed ${failedCount}.`;

  return {
    status: createdCount > 0 || skippedCount > 0 ? "success" : "error",
    message,
    createdCount,
    skippedCount,
    failedCount,
    results,
  };
}

async function importOneRow(params: {
  row: ParsedProductCsvRow;
  branchId: string;
  canMarkGlobal: boolean;
  unitByKey: Map<string, string>;
  categoryByKey: Map<string, string>;
  brandByKey: Map<string, string>;
  supplierByKey: Map<string, string>;
  existingSkus: Set<string>;
  existingBarcodes: Set<string>;
  seenSkus: Set<string>;
  seenBarcodes: Set<string>;
  supabase: Awaited<ReturnType<typeof getBranchScopedServerClient>>["supabase"];
}): Promise<ProductCsvImportRowResult> {
  const { row } = params;
  const displayName = row.values?.name || row.raw.name || `Row ${row.rowNumber}`;

  if (row.errors.length > 0 || !row.values) {
    return {
      rowNumber: row.rowNumber,
      name: displayName,
      status: "failed",
      message: row.errors.join(" "),
    };
  }

  const values = row.values;
  const resolved = resolveRowReferences(values, params);

  if (resolved.errors.length > 0) {
    return {
      rowNumber: row.rowNumber,
      name: values.name,
      status: "failed",
      message: resolved.errors.join(" "),
    };
  }

  const sku = normalizeNullableUpper(values.sku);
  const barcode = normalizeNullableUpper(values.barcode);

  if (sku && (params.existingSkus.has(sku) || params.seenSkus.has(sku))) {
    return {
      rowNumber: row.rowNumber,
      name: values.name,
      status: "skipped",
      message: `SKU ${sku} already exists.`,
    };
  }

  if (barcode && (params.existingBarcodes.has(barcode) || params.seenBarcodes.has(barcode))) {
    return {
      rowNumber: row.rowNumber,
      name: values.name,
      status: "skipped",
      message: `Barcode ${barcode} already exists.`,
    };
  }

  if (values.shareGlobally && !params.canMarkGlobal) {
    return {
      rowNumber: row.rowNumber,
      name: values.name,
      status: "failed",
      message: "Only owner and admin roles can share products globally.",
    };
  }

  const productId = randomUUID();
  const { error } = await params.supabase.from("products").insert({
    id: productId,
    branch_id: params.branchId,
    is_global: values.shareGlobally && params.canMarkGlobal,
    name: values.name,
    sku,
    barcode,
    category_id: resolved.categoryId,
    brand_id: resolved.brandId,
    primary_supplier_id: resolved.supplierId,
    unit_id: resolved.unitId,
    part_number: normalizeNullable(values.partNumber),
    oem_number: normalizeNullable(values.oemNumber),
    description: normalizeNullable(values.description),
    product_type: values.productType,
    cost_price: Number(values.costPrice),
    selling_price: Number(values.sellingPrice),
    reorder_level: Number(values.reorderLevel || "0"),
    warranty_duration_days: null,
    shelf_location: normalizeNullable(values.shelfLocation),
    product_image_path: null,
    product_image_url: null,
    website_visible: false,
    website_featured: false,
    website_sort_order: 0,
    website_slug: null,
    website_image_url: null,
    website_short_description: null,
    website_badge: null,
    status: values.status,
  });

  if (error) {
    return {
      rowNumber: row.rowNumber,
      name: values.name,
      status: "failed",
      message: error.message,
    };
  }

  if (sku) {
    params.seenSkus.add(sku);
    params.existingSkus.add(sku);
  }

  if (barcode) {
    params.seenBarcodes.add(barcode);
    params.existingBarcodes.add(barcode);
  }

  return {
    rowNumber: row.rowNumber,
    name: values.name,
    status: "created",
    message: "Created.",
  };
}

function resolveRowReferences(
  values: ProductCsvRowValues,
  params: {
    unitByKey: Map<string, string>;
    categoryByKey: Map<string, string>;
    brandByKey: Map<string, string>;
    supplierByKey: Map<string, string>;
  },
) {
  const errors: string[] = [];
  const unitId = params.unitByKey.get(normalizeLookupKey(values.unit));

  if (!unitId) {
    errors.push(`Unknown unit "${values.unit}". Use an existing unit name or abbreviation.`);
  }

  let categoryId: string | null = null;
  if (values.category) {
    categoryId = params.categoryByKey.get(normalizeLookupKey(values.category)) ?? null;
    if (!categoryId) {
      errors.push(`Unknown category "${values.category}".`);
    }
  }

  let brandId: string | null = null;
  if (values.brand) {
    brandId = params.brandByKey.get(normalizeLookupKey(values.brand)) ?? null;
    if (!brandId) {
      errors.push(`Unknown brand "${values.brand}".`);
    }
  }

  let supplierId: string | null = null;
  if (values.supplier) {
    supplierId = params.supplierByKey.get(normalizeLookupKey(values.supplier)) ?? null;
    if (!supplierId) {
      errors.push(`Unknown supplier "${values.supplier}".`);
    }
  }

  return {
    unitId: unitId ?? "",
    categoryId,
    brandId,
    supplierId,
    errors,
  };
}

function buildLookupMap(entries: Array<{ id: string; keys: Array<string | null | undefined> }>) {
  const map = new Map<string, string>();

  for (const entry of entries) {
    for (const key of entry.keys) {
      const normalized = normalizeLookupKey(key ?? "");
      if (normalized && !map.has(normalized)) {
        map.set(normalized, entry.id);
      }
    }
  }

  return map;
}

function normalizeLookupKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeNullableUpper(value: string) {
  const trimmed = value.trim().toUpperCase();
  return trimmed ? trimmed : null;
}

async function readCsvText(
  formData: FormData,
): Promise<{ text: string; error: string | null }> {
  const file = formData.get("csvFile");
  if (file instanceof File && file.size > 0) {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      return {
        text: "",
        error:
          "Excel workbooks (.xlsx/.xls) are not supported. Open the file and use Save As → CSV, then upload that CSV.",
      };
    }

    // File.text() is available in the Node 20+ / undici File implementation used by Next.
    return { text: await file.text(), error: null };
  }

  const text = formData.get("csvText");
  return {
    text: typeof text === "string" && text.trim() ? text : "",
    error: null,
  };
}
