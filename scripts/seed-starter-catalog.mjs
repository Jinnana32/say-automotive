#!/usr/bin/env node

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const SEED_PATH = new URL("../supabase/seed/starter-catalog.json", import.meta.url);
const args = new Set(process.argv.slice(2));
const shouldApply = args.has("--apply");

const seed = await readSeedFile(SEED_PATH);

if (!shouldApply) {
  console.log(
    [
      "Starter catalog seed is ready.",
      `Units: ${seed.units.length}`,
      `Categories: ${seed.categories.length}`,
      `Brands: ${seed.brands.length}`,
      `Suppliers: ${seed.suppliers.length}`,
      `Services: ${seed.services.length}`,
      `Products: ${seed.products.length}`,
      "",
      "Run with --apply to upsert it into the current Supabase project.",
    ].join("\n"),
  );
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: branch, error: branchError } = await supabase
  .from("branches")
  .select("id, name")
  .eq("is_default", true)
  .single();

if (branchError) {
  throw branchError;
}

await upsertRows(
  supabase,
  "units",
  "name",
  seed.units.map((unit) => ({
    name: unit.name,
    abbreviation: unit.abbreviation,
  })),
);

await upsertRows(
  supabase,
  "product_categories",
  "name",
  seed.categories.map((category) => ({
    name: category.name,
    description: category.description ?? null,
    status: "active",
  })),
);

await upsertRows(
  supabase,
  "brands",
  "name",
  seed.brands.map((brand) => ({
    name: brand.name,
    description: brand.description ?? null,
    status: "active",
  })),
);

await upsertRows(
  supabase,
  "suppliers",
  "supplier_name",
  seed.suppliers.map((supplier) => ({
    supplier_name: supplier.supplier_name,
    contact_person: supplier.contact_person ?? null,
    contact_number: supplier.contact_number ?? null,
    email: supplier.email ?? null,
    address: supplier.address ?? null,
    payment_terms: supplier.payment_terms ?? null,
    notes: supplier.notes ?? null,
    status: "active",
  })),
);

const [units, categories, brands, suppliers] = await Promise.all([
  loadReferenceMap(supabase, "units", "name", "id"),
  loadReferenceMap(supabase, "product_categories", "name", "id"),
  loadReferenceMap(supabase, "brands", "name", "id"),
  loadReferenceMap(supabase, "suppliers", "supplier_name", "id"),
]);

const serviceSummary = await seedServices({
  supabase,
  branchId: branch.id,
  services: seed.services,
});
const productSummary = await seedProducts({
  supabase,
  branchId: branch.id,
  units,
  categories,
  brands,
  suppliers,
  products: seed.products,
});

console.log(
  [
    `Starter catalog applied to default branch: ${branch.name}`,
    `Services inserted: ${serviceSummary.inserted}`,
    `Services updated: ${serviceSummary.updated}`,
    `Products inserted: ${productSummary.inserted}`,
    `Products updated: ${productSummary.updated}`,
  ].join("\n"),
);

async function readSeedFile(seedPath) {
  const { readFile } = await import("node:fs/promises");
  const raw = await readFile(seedPath, "utf8");
  return JSON.parse(raw);
}

async function upsertRows(supabase, table, conflictColumn, rows) {
  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictColumn });

  if (error) {
    throw error;
  }
}

async function loadReferenceMap(supabase, table, labelColumn, idColumn) {
  const { data, error } = await supabase.from(table).select(`${idColumn}, ${labelColumn}`);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((row) => [String(row[labelColumn]), String(row[idColumn])]));
}

async function seedServices({ supabase, branchId, services }) {
  const { data: existingServices, error: existingServicesError } = await supabase
    .from("services")
    .select("id, name")
    .eq("branch_id", branchId);

  if (existingServicesError) {
    throw existingServicesError;
  }

  const existingServiceMap = new Map(
    (existingServices ?? []).map((service) => [normalize(service.name), service.id]),
  );

  let inserted = 0;
  let updated = 0;

  for (const service of services) {
    const payload = {
      branch_id: branchId,
      name: service.name,
      category: service.category ?? null,
      description: service.description ?? null,
      labor_price: Number(service.labor_price),
      estimated_duration_minutes: service.estimated_duration_minutes ?? null,
      status: "active",
    };

    const existingId = existingServiceMap.get(normalize(service.name));

    const operation = existingId
      ? supabase.from("services").update(payload).eq("id", existingId)
      : supabase.from("services").insert(payload);

    const { error } = await operation;

    if (error) {
      throw error;
    }

    if (existingId) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  return { inserted, updated };
}

async function seedProducts({
  supabase,
  branchId,
  units,
  categories,
  brands,
  suppliers,
  products,
}) {
  const { data: existingProducts, error: existingProductsError } = await supabase
    .from("products")
    .select("id, sku")
    .or(`branch_id.eq.${branchId},branch_id.is.null`);

  if (existingProductsError) {
    throw existingProductsError;
  }

  const existingProductMap = new Map(
    (existingProducts ?? [])
      .filter((product) => product.sku)
      .map((product) => [normalizeSku(product.sku), product.id]),
  );

  let inserted = 0;
  let updated = 0;

  for (const product of products) {
    const unitId = units.get(product.unit);
    const categoryId = categories.get(product.category);
    const brandId = brands.get(product.brand);
    const supplierId = suppliers.get(product.supplier);

    if (!unitId || !categoryId || !brandId || !supplierId) {
      throw new Error(`Missing reference row for product seed: ${product.name}`);
    }

    const payload = {
      branch_id: branchId,
      name: product.name,
      sku: product.sku,
      barcode: null,
      category_id: categoryId,
      brand_id: brandId,
      primary_supplier_id: supplierId,
      unit_id: unitId,
      part_number: product.part_number ?? null,
      oem_number: product.oem_number ?? null,
      description: product.description ?? null,
      product_type: product.product_type,
      cost_price: Number(product.cost_price),
      selling_price: Number(product.selling_price),
      reorder_level: Number(product.reorder_level ?? 0),
      warranty_duration_days: product.warranty_duration_days ?? null,
      shelf_location: product.shelf_location ?? null,
      status: "active",
    };

    const existingId = existingProductMap.get(normalizeSku(product.sku));

    const operation = existingId
      ? supabase.from("products").update(payload).eq("id", existingId)
      : supabase.from("products").insert(payload);

    const { error } = await operation;

    if (error) {
      throw error;
    }

    if (existingId) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  return { inserted, updated };
}

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function normalizeSku(value) {
  return normalize(value).replace(/\s+/g, "");
}
