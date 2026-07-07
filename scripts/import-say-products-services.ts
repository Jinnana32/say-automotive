#!/usr/bin/env node
// @ts-nocheck

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const DEFAULT_FILE_PATH =
  "/Users/charliemaecoyoca/Downloads/SAY Auto Care Product Inventory (1).xlsx";
const args = process.argv.slice(2);
const shouldApply = args.includes("--apply");
const fillZeroValues = args.includes("--fill-zero-values");
const filePath = readArg("--file") ?? DEFAULT_FILE_PATH;
const branchCode = readArg("--branch-code");
const branchIdArg = readArg("--branch-id");
const pythonBins = [
  readArg("--python-bin"),
  process.env.PYTHON_BIN,
  "/Users/charliemaecoyoca/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
  "python3",
].filter(Boolean);

if (!existsSync(filePath)) {
  throw new Error(`Excel file not found: ${filePath}`);
}

const workbook = await readWorkbook(filePath);
const productRows = parseProducts(workbook);
const serviceRows = parseServices(workbook);
const supplierRows = parseSuppliers(workbook);
const invalidProducts = productRows.filter((row) => !row.valid);
const invalidServices = serviceRows.filter((row) => !row.valid);
const validProducts = productRows.filter((row) => row.valid);
const validServices = serviceRows.filter((row) => row.valid);

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

const branch = await resolveBranch();
const references = await loadAndEnsureReferences({
  productRows: validProducts,
  supplierRows,
});
const productSummary = await importProducts(validProducts, references);
const serviceSummary = await importServices(validServices);

printSummary({
  branch,
  productRows,
  productSummary,
  invalidProducts,
  serviceRows,
  serviceSummary,
  invalidServices,
  supplierSummary: references.suppliers.summary,
  referenceSummary: references.summary,
});

async function readWorkbook(path) {
  try {
    const xlsx = await import("xlsx");
    const file = xlsx.readFile(path, { cellDates: true });
    const sheets = {};

    for (const sheetName of file.SheetNames) {
      sheets[sheetName] = xlsx.utils.sheet_to_json(file.Sheets[sheetName], {
        defval: null,
        raw: true,
      });
    }

    return { sheetNames: file.SheetNames, sheets, reader: "xlsx" };
  } catch (error) {
    let lastFailure = "";

    for (const pythonBin of pythonBins) {
      const result = spawnSync(
        pythonBin,
        [
          "-c",
          `
import json
import math
import sys

try:
    import pandas as pd
except Exception as exc:
    raise SystemExit(f"Unable to import pandas/openpyxl: {exc}")

path = sys.argv[1]
book = pd.ExcelFile(path)
out = {"sheetNames": book.sheet_names, "sheets": {}, "reader": "python-pandas"}

def clean(value):
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except Exception:
        pass
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, float) and math.isnan(value):
        return None
    return value

for sheet in book.sheet_names:
    frame = pd.read_excel(path, sheet_name=sheet, dtype=object)
    rows = []
    for record in frame.to_dict(orient="records"):
        rows.append({str(key): clean(value) for key, value in record.items()})
    out["sheets"][sheet] = rows

print(json.dumps(out, ensure_ascii=False))
        `,
          path,
        ],
        { encoding: "utf8", maxBuffer: 1024 * 1024 * 80 },
      );

      if (result.status === 0) {
        return JSON.parse(result.stdout);
      }

      lastFailure = result.stderr.trim();
    }

    throw new Error(
      [
        "Unable to read the workbook.",
        "Install the xlsx npm package or run with --python-bin pointing to a Python that has pandas/openpyxl.",
        lastFailure,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
}

function parseProducts(workbook) {
  const rows = findSheetRows(workbook, "Products");

  return rows.flatMap((row, index) => {
    if (isBlankRow(row, [
      "Product ID",
      "Product Name",
      "Category",
      "Brand",
      "Part No.",
      "OEM No.",
      "Barcode",
      "Unit",
      "Cost Price",
      "Selling Price",
      "Current Stock",
      "Reorder Level",
      "Location",
      "Supplier",
      "Notes",
    ])) {
      return [];
    }

    const productName = cleanText(getValue(row, "Product Name"));
    const productId = cleanText(getValue(row, "Product ID"));
    const partNumber = cleanText(getValue(row, "Part No."));
    const parsed = {
      rowNumber: index + 2,
      valid: true,
      productId,
      name: productName,
      category: cleanText(getValue(row, "Category")),
      brand: cleanText(getValue(row, "Brand")),
      partNumber,
      oemNumber: cleanText(getValue(row, "OEM No.")),
      barcode: cleanText(getValue(row, "Barcode")),
      unit: cleanText(getValue(row, "Unit")) ?? "Piece",
      costPrice: parseNonNegativeNumber(getValue(row, "Cost Price"), 0),
      sellingPrice: parseNonNegativeNumber(getValue(row, "Selling Price"), 0),
      currentStock: parseNonNegativeNumber(getValue(row, "Current Stock"), 0),
      reorderLevel: parseNonNegativeNumber(getValue(row, "Reorder Level"), 0),
      location: cleanText(getValue(row, "Location")),
      supplier: cleanText(getValue(row, "Supplier")),
      notes: cleanText(getValue(row, "Notes")),
      invalidReason: null,
    };

    if (!productName) {
      return { ...parsed, valid: false, invalidReason: "Missing Product Name" };
    }

    for (const [field, value] of [
      ["Cost Price", parsed.costPrice],
      ["Selling Price", parsed.sellingPrice],
      ["Current Stock", parsed.currentStock],
      ["Reorder Level", parsed.reorderLevel],
    ]) {
      if (value === null) {
        return { ...parsed, valid: false, invalidReason: `${field} is not a non-negative number` };
      }
    }

    return [parsed];
  });
}

function parseServices(workbook) {
  const rows = findSheetRows(workbook, "Service");

  return rows.flatMap((row, index) => {
    if (isBlankRow(row, ["Services", "Category", "Labor Cost"])) {
      return [];
    }

    const serviceName = cleanText(getValue(row, "Services"));
    const laborCost = parseNonNegativeNumber(getValue(row, "Labor Cost"), 0);
    const parsed = {
      rowNumber: index + 2,
      valid: true,
      name: serviceName,
      category: cleanText(getValue(row, "Category")),
      laborPrice: laborCost,
      invalidReason: null,
    };

    if (!serviceName) {
      return { ...parsed, valid: false, invalidReason: "Missing Services" };
    }

    if (laborCost === null) {
      return { ...parsed, valid: false, invalidReason: "Labor Cost is not a non-negative number" };
    }

    return [parsed];
  });
}

function parseSuppliers(workbook) {
  const rows = findSheetRows(workbook, "Suppliers");
  const suppliers = [];

  for (const [index, row] of rows.entries()) {
    const supplierName = cleanText(getValue(row, "Supplier Name"));

    if (!supplierName) {
      continue;
    }

    suppliers.push({
      rowNumber: index + 2,
      supplierName,
      address: cleanText(getValue(row, "Address")),
      contactPerson: cleanText(getValue(row, "Contact Person Name")),
      contactNumber: cleanText(getValue(row, "Contact Number")),
      email: cleanText(getValue(row, "Email")),
      paymentTerms: cleanText(getValue(row, "Payment Terms")),
    });
  }

  return suppliers;
}

async function resolveBranch() {
  let query = supabase.from("branches").select("id, code, name").limit(1);

  if (branchIdArg) {
    query = query.eq("id", branchIdArg);
  } else if (branchCode) {
    query = query.eq("code", branchCode);
  } else {
    query = query.eq("is_default", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("No matching branch found. Pass --branch-code or --branch-id.");
  }

  return data;
}

async function loadAndEnsureReferences({ productRows, supplierRows }) {
  const categories = await loadReference("product_categories", "name", "name");
  const brands = await loadReference("brands", "name", "name");
  const units = await loadReference("units", "name", "abbreviation");
  const suppliers = await loadSuppliers();

  for (const name of unique(productRows.map((row) => row.category).filter(Boolean))) {
    await ensureReference(categories, "product_categories", { name, status: "active" });
  }

  for (const name of unique(productRows.map((row) => row.brand).filter(Boolean))) {
    await ensureReference(brands, "brands", { name, status: "active" });
  }

  for (const name of unique(productRows.map((row) => row.unit).filter(Boolean))) {
    await ensureUnit(units, name);
  }

  const supplierDetailsByName = new Map(
    supplierRows.map((row) => [normalize(row.supplierName), row]),
  );
  const supplierNames = unique([
    ...supplierRows.map((row) => row.supplierName),
    ...productRows.map((row) => row.supplier).filter(Boolean),
  ]);

  for (const supplierName of supplierNames) {
    await ensureSupplier(suppliers, supplierName, supplierDetailsByName.get(normalize(supplierName)));
  }

  return {
    categories,
    brands,
    units,
    suppliers,
    summary: {
      categoriesInserted: categories.summary.inserted,
      brandsInserted: brands.summary.inserted,
      unitsInserted: units.summary.inserted,
    },
  };
}

async function loadReference(table, labelColumn, alternateColumn) {
  const { data, error } = await supabase.from(table).select(`id, ${labelColumn}, ${alternateColumn}`);

  if (error) {
    throw error;
  }

  const ref = { byName: new Map(), summary: { inserted: 0, skippedDuplicates: 0 } };

  for (const row of data ?? []) {
    addReference(ref, row[labelColumn], row.id);

    if (alternateColumn && alternateColumn !== labelColumn) {
      addReference(ref, row[alternateColumn], row.id);
    }
  }

  return ref;
}

async function loadSuppliers() {
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, supplier_name, contact_person, contact_number, email, address, payment_terms, notes");

  if (error) {
    throw error;
  }

  const ref = {
    byName: new Map(),
    rowsById: new Map(),
    summary: { inserted: 0, skippedDuplicates: 0, updatedSafeFields: 0 },
  };

  for (const row of data ?? []) {
    ref.byName.set(normalize(row.supplier_name), row.id);
    ref.rowsById.set(row.id, row);
  }

  return ref;
}

async function ensureReference(ref, table, payload) {
  const key = normalize(payload.name);

  if (ref.byName.has(key)) {
    ref.summary.skippedDuplicates += 1;
    return ref.byName.get(key);
  }

  if (!shouldApply) {
    const dryId = `dry-${table}-${key}`;
    addReference(ref, payload.name, dryId);
    ref.summary.inserted += 1;
    return dryId;
  }

  const { data, error } = await supabase.from(table).insert(payload).select("id").single();

  if (error) {
    throw error;
  }

  addReference(ref, payload.name, data.id);
  ref.summary.inserted += 1;
  return data.id;
}

async function ensureUnit(ref, unitName) {
  const key = normalize(unitName);

  if (ref.byName.has(key)) {
    ref.summary.skippedDuplicates += 1;
    return ref.byName.get(key);
  }

  const payload = {
    name: unitName,
    abbreviation: buildUnitAbbreviation(unitName),
  };

  if (!shouldApply) {
    const dryId = `dry-units-${key}`;
    ref.byName.set(key, dryId);
    ref.summary.inserted += 1;
    return dryId;
  }

  const { data, error } = await supabase.from("units").insert(payload).select("id").single();

  if (error) {
    throw error;
  }

  addReference(ref, unitName, data.id);
  addReference(ref, payload.abbreviation, data.id);
  ref.summary.inserted += 1;
  return data.id;
}

async function ensureSupplier(ref, supplierName, details) {
  const key = normalize(supplierName);
  const existingId = ref.byName.get(key);

  if (existingId) {
    ref.summary.skippedDuplicates += 1;
    await updateSupplierEmptyFields(ref, existingId, details);
    return existingId;
  }

  const payload = {
    supplier_name: supplierName,
    contact_person: details?.contactPerson ?? null,
    contact_number: details?.contactNumber ?? null,
    email: details?.email ?? null,
    address: details?.address ?? null,
    payment_terms: details?.paymentTerms ?? null,
    notes: null,
    status: "active",
  };

  if (!shouldApply) {
    const dryId = `dry-supplier-${key}`;
    ref.byName.set(key, dryId);
    ref.summary.inserted += 1;
    return dryId;
  }

  const { data, error } = await supabase.from("suppliers").insert(payload).select("*").single();

  if (error) {
    throw error;
  }

  ref.byName.set(key, data.id);
  ref.rowsById.set(data.id, data);
  ref.summary.inserted += 1;
  return data.id;
}

async function updateSupplierEmptyFields(ref, supplierId, details) {
  if (!details) {
    return;
  }

  const existing = ref.rowsById.get(supplierId);

  if (!existing) {
    return;
  }

  const updates = pickEmptyFieldUpdates(existing, {
    contact_person: details.contactPerson,
    contact_number: details.contactNumber,
    email: details.email,
    address: details.address,
    payment_terms: details.paymentTerms,
  });

  if (Object.keys(updates).length === 0) {
    return;
  }

  ref.summary.updatedSafeFields += 1;

  if (!shouldApply) {
    return;
  }

  const { error } = await supabase.from("suppliers").update(updates).eq("id", supplierId);

  if (error) {
    throw error;
  }

  ref.rowsById.set(supplierId, { ...existing, ...updates });
}

async function importProducts(rows, references) {
  const existing = await loadExistingProducts(references);
  const summary = {
    totalRowsRead: productRows.length,
    inserted: 0,
    skippedDuplicates: 0,
    updatedSafeFields: 0,
    stockRowsInserted: 0,
    invalidRows: invalidProducts.length,
    duplicateExamples: [],
  };

  for (const row of rows) {
    const categoryId = row.category ? references.categories.byName.get(normalize(row.category)) : null;
    const brandId = row.brand ? references.brands.byName.get(normalize(row.brand)) : null;
    const unitId = references.units.byName.get(normalize(row.unit));
    const supplierId = row.supplier ? references.suppliers.byName.get(normalize(row.supplier)) : null;
    const duplicate = findExistingProduct(existing, row, { brandId, unitId });

    if (duplicate) {
      summary.skippedDuplicates += 1;
      addDuplicateExample(summary.duplicateExamples, row.name, duplicate.reason);
      const updated = await updateProductEmptyFields(duplicate.product, row, {
        categoryId,
        brandId,
        unitId,
        supplierId,
      });
      summary.updatedSafeFields += updated ? 1 : 0;
      summary.stockRowsInserted += await ensureInitialStockRow(
        duplicate.product.id,
        row,
        duplicate.product.hasStockRow,
      );
      continue;
    }

    const payload = {
      branch_id: branch.id,
      is_global: false,
      name: row.name,
      sku: row.partNumber ?? row.productId ?? null,
      barcode: row.barcode,
      category_id: categoryId ?? null,
      brand_id: brandId ?? null,
      primary_supplier_id: supplierId ?? null,
      unit_id: unitId,
      part_number: row.partNumber,
      oem_number: row.oemNumber,
      description: row.notes,
      product_type: inferProductType(row.category),
      cost_price: row.costPrice,
      selling_price: row.sellingPrice,
      reorder_level: row.reorderLevel,
      shelf_location: row.location,
      status: "active",
    };

    if (!unitId) {
      throw new Error(`Unable to resolve unit for product "${row.name}".`);
    }

    if (!shouldApply) {
      const dryProduct = { ...payload, id: `dry-product-${summary.inserted + 1}`, hasStockRow: false };
      addProductKeys(existing, dryProduct, references);
      summary.inserted += 1;
      summary.stockRowsInserted += row.currentStock > 0 || row.reorderLevel > 0 || row.location ? 1 : 0;
      continue;
    }

    const { data, error } = await supabase.from("products").insert(payload).select("*").single();

    if (error) {
      throw error;
    }

    const product = { ...data, hasStockRow: false };
    addProductKeys(existing, product, references);
    summary.inserted += 1;
    summary.stockRowsInserted += await ensureInitialStockRow(product.id, row, false);
  }

  return summary;
}

async function loadExistingProducts(references) {
  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, branch_id, name, sku, barcode, category_id, brand_id, primary_supplier_id, unit_id, part_number, oem_number, description, cost_price, selling_price, reorder_level, shelf_location, status",
    )
    .or(`branch_id.eq.${branch.id},branch_id.is.null`);

  if (error) {
    throw error;
  }

  const productIds = (products ?? []).map((product) => product.id);
  const stockProductIds = new Set();

  if (productIds.length > 0) {
    const { data: stocks, error: stockError } = await supabase
      .from("inventory_stocks")
      .select("product_id")
      .eq("branch_id", branch.id)
      .in("product_id", productIds);

    if (stockError) {
      throw stockError;
    }

    for (const stock of stocks ?? []) {
      stockProductIds.add(stock.product_id);
    }
  }

  const lookup = {
    bySku: new Map(),
    byBarcode: new Map(),
    byPartNumber: new Map(),
    byOemNumber: new Map(),
    byCombo: new Map(),
  };

  for (const product of products ?? []) {
    addProductKeys(lookup, { ...product, hasStockRow: stockProductIds.has(product.id) }, references);
  }

  return lookup;
}

function addProductKeys(lookup, product, references) {
  if (product.sku) {
    lookup.bySku.set(normalize(product.sku), product);
  }

  if (product.barcode) {
    lookup.byBarcode.set(normalize(product.barcode), product);
  }

  if (product.part_number) {
    lookup.byPartNumber.set(normalize(product.part_number), product);
  }

  if (product.oem_number) {
    lookup.byOemNumber.set(normalize(product.oem_number), product);
  }

  const brandName = references.brands.byId?.get(product.brand_id) ?? null;
  const unitName = references.units.byId?.get(product.unit_id) ?? null;
  lookup.byCombo.set(productComboKey(product.name, brandName, unitName), product);
}

function findExistingProduct(lookup, row, { brandId, unitId }) {
  if (row.barcode) {
    const match = lookup.byBarcode.get(normalize(row.barcode));

    if (match) {
      return { product: match, reason: "barcode" };
    }
  }

  if (row.partNumber) {
    const match = lookup.byPartNumber.get(normalize(row.partNumber));

    if (match) {
      return { product: match, reason: "part number" };
    }
  }

  if (row.oemNumber) {
    const match = lookup.byOemNumber.get(normalize(row.oemNumber));

    if (match) {
      return { product: match, reason: "OEM number" };
    }
  }

  if (row.productId) {
    const match = lookup.bySku.get(normalize(row.productId));

    if (match) {
      return { product: match, reason: "Product ID / SKU" };
    }
  }

  const match = lookup.byCombo.get(productComboKey(row.name, row.brand, row.unit));

  if (match) {
    return { product: match, reason: "name + brand + unit" };
  }

  return null;
}

async function updateProductEmptyFields(existing, row, refs) {
  const updates = pickEmptyFieldUpdates(existing, {
    sku: row.partNumber ?? row.productId ?? null,
    barcode: row.barcode,
    category_id: refs.categoryId,
    brand_id: refs.brandId,
    primary_supplier_id: refs.supplierId,
    part_number: row.partNumber,
    oem_number: row.oemNumber,
    description: row.notes,
    shelf_location: row.location,
  });

  if (fillZeroValues) {
    if (Number(existing.cost_price) === 0 && row.costPrice > 0) updates.cost_price = row.costPrice;
    if (Number(existing.selling_price) === 0 && row.sellingPrice > 0) updates.selling_price = row.sellingPrice;
    if (Number(existing.reorder_level) === 0 && row.reorderLevel > 0) updates.reorder_level = row.reorderLevel;
  }

  if (Object.keys(updates).length === 0) {
    return false;
  }

  if (!shouldApply) {
    return true;
  }

  const { error } = await supabase.from("products").update(updates).eq("id", existing.id);

  if (error) {
    throw error;
  }

  Object.assign(existing, updates);
  return true;
}

async function ensureInitialStockRow(productId, row, hasStockRow) {
  const shouldCreate = !hasStockRow && (row.currentStock > 0 || row.reorderLevel > 0 || row.location);

  if (!shouldCreate) {
    return 0;
  }

  if (!shouldApply) {
    return 1;
  }

  const { error } = await supabase.from("inventory_stocks").insert({
    branch_id: branch.id,
    product_id: productId,
    quantity_on_hand: row.currentStock,
    reserved_quantity: 0,
    reorder_level: row.reorderLevel,
    shelf_location: row.location,
  });

  if (error && error.code !== "23505") {
    throw error;
  }

  return error ? 0 : 1;
}

async function importServices(rows) {
  const existing = await loadExistingServices();
  const summary = {
    totalRowsRead: serviceRows.length,
    inserted: 0,
    skippedDuplicates: 0,
    updatedSafeFields: 0,
    invalidRows: invalidServices.length,
    duplicateExamples: [],
  };

  for (const row of rows) {
    const duplicate = findExistingService(existing, row);

    if (duplicate) {
      summary.skippedDuplicates += 1;
      addDuplicateExample(summary.duplicateExamples, row.name, duplicate.reason);
      const updated = await updateServiceEmptyFields(duplicate.service, row);
      summary.updatedSafeFields += updated ? 1 : 0;
      continue;
    }

    const payload = {
      branch_id: branch.id,
      is_global: false,
      name: row.name,
      category: row.category,
      description: null,
      labor_price: row.laborPrice,
      estimated_duration_minutes: null,
      status: "active",
    };

    if (!shouldApply) {
      addServiceKeys(existing, { ...payload, id: `dry-service-${summary.inserted + 1}` });
      summary.inserted += 1;
      continue;
    }

    const { data, error } = await supabase.from("services").insert(payload).select("*").single();

    if (error) {
      throw error;
    }

    addServiceKeys(existing, data);
    summary.inserted += 1;
  }

  return summary;
}

async function loadExistingServices() {
  const { data, error } = await supabase
    .from("services")
    .select("id, branch_id, name, category, description, labor_price, estimated_duration_minutes, status")
    .or(`branch_id.eq.${branch.id},branch_id.is.null`);

  if (error) {
    throw error;
  }

  const lookup = { byName: new Map(), byNameCategory: new Map() };

  for (const service of data ?? []) {
    addServiceKeys(lookup, service);
  }

  return lookup;
}

function addServiceKeys(lookup, service) {
  lookup.byName.set(normalize(service.name), service);
  lookup.byNameCategory.set(serviceKey(service.name, service.category), service);
}

function findExistingService(lookup, row) {
  if (row.category) {
    const match = lookup.byNameCategory.get(serviceKey(row.name, row.category));

    if (match) {
      return { service: match, reason: "name + category" };
    }
  }

  const match = lookup.byName.get(normalize(row.name));

  if (match) {
    return { service: match, reason: "name" };
  }

  return null;
}

async function updateServiceEmptyFields(existing, row) {
  const updates = pickEmptyFieldUpdates(existing, {
    category: row.category,
  });

  if (fillZeroValues && Number(existing.labor_price) === 0 && row.laborPrice > 0) {
    updates.labor_price = row.laborPrice;
  }

  if (Object.keys(updates).length === 0) {
    return false;
  }

  if (!shouldApply) {
    return true;
  }

  const { error } = await supabase.from("services").update(updates).eq("id", existing.id);

  if (error) {
    throw error;
  }

  Object.assign(existing, updates);
  return true;
}

function findSheetRows(workbook, expectedName) {
  const normalizedExpected = normalize(expectedName);
  const sheetName = workbook.sheetNames.find((name) => normalize(name) === normalizedExpected);

  if (!sheetName) {
    throw new Error(`Missing sheet: ${expectedName}`);
  }

  return workbook.sheets[sheetName] ?? [];
}

function getValue(row, expectedColumn) {
  const expected = normalize(expectedColumn);
  const entry = Object.entries(row).find(([key]) => normalize(key) === expected);
  return entry ? entry[1] : null;
}

function isBlankRow(row, columns) {
  return columns.every((column) => cleanText(getValue(row, column)) === null);
}

function cleanText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim().replace(/\s+/g, " ");
  return trimmed ? trimmed : null;
}

function parseNonNegativeNumber(value, defaultValue) {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  const cleaned = typeof value === "string" ? value.replace(/[₱,\s]/g, "") : value;
  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function productComboKey(name, brand, unit) {
  return [name, brand, unit].map(normalize).join("|");
}

function serviceKey(name, category) {
  return [name, category].map(normalize).join("|");
}

function unique(values) {
  return [...new Map(values.filter(Boolean).map((value) => [normalize(value), value])).values()];
}

function addReference(ref, label, id) {
  if (!label) {
    return;
  }

  ref.byName.set(normalize(label), id);
  ref.byId ??= new Map();
  ref.byId.set(id, label);
}

function pickEmptyFieldUpdates(existing, candidates) {
  const updates = {};

  for (const [key, value] of Object.entries(candidates)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const current = existing[key];

    if (current === null || current === undefined || String(current).trim() === "") {
      updates[key] = value;
    }
  }

  return updates;
}

function inferProductType(category) {
  const normalizedCategory = normalize(category);

  if (normalizedCategory.includes("lubricant") || normalizedCategory.includes("fluid")) {
    return "fluid";
  }

  if (normalizedCategory.includes("accessor") || normalizedCategory.includes("mags")) {
    return "accessory";
  }

  if (normalizedCategory.includes("tool")) {
    return "tool";
  }

  return "part";
}

function buildUnitAbbreviation(name) {
  const normalizedName = normalize(name);
  const known = {
    bottle: "btl",
    gallon: "gal",
    liter: "L",
    pair: "pair",
    piece: "pc",
    set: "set",
  };

  return known[normalizedName] ?? normalizedName.slice(0, 8);
}

function addDuplicateExample(examples, name, reason) {
  if (examples.length >= 5) {
    return;
  }

  examples.push(`${name} (${reason})`);
}

function printSummary({
  branch,
  productRows,
  productSummary,
  invalidProducts,
  serviceRows,
  serviceSummary,
  invalidServices,
  supplierSummary,
  referenceSummary,
}) {
  const mode = shouldApply ? "APPLIED" : "DRY RUN";
  const lines = [
    `SAY catalog import ${mode}`,
    `Workbook reader: ${workbook.reader}`,
    `File: ${filePath}`,
    `Branch: ${branch.name} (${branch.code ?? branch.id})`,
    "",
    "Products:",
    `  total rows read: ${productRows.length}`,
    `  inserted: ${productSummary.inserted}`,
    `  skipped duplicates: ${productSummary.skippedDuplicates}`,
    `  updated safe empty fields: ${productSummary.updatedSafeFields}`,
    `  stock rows inserted: ${productSummary.stockRowsInserted}`,
    `  invalid/skipped rows: ${invalidProducts.length}`,
    "",
    "Services:",
    `  total rows read: ${serviceRows.length}`,
    `  inserted: ${serviceSummary.inserted}`,
    `  skipped duplicates: ${serviceSummary.skippedDuplicates}`,
    `  updated safe empty fields: ${serviceSummary.updatedSafeFields}`,
    `  invalid/skipped rows: ${invalidServices.length}`,
    "",
    "Suppliers:",
    `  inserted: ${supplierSummary.inserted}`,
    `  skipped duplicates: ${supplierSummary.skippedDuplicates}`,
    `  updated safe empty fields: ${supplierSummary.updatedSafeFields}`,
    "",
    "Reference rows:",
    `  categories inserted: ${referenceSummary.categoriesInserted}`,
    `  brands inserted: ${referenceSummary.brandsInserted}`,
    `  units inserted: ${referenceSummary.unitsInserted}`,
  ];

  if (productSummary.duplicateExamples.length > 0) {
    lines.push("", "Product duplicate examples:", ...productSummary.duplicateExamples.map((item) => `  - ${item}`));
  }

  if (serviceSummary.duplicateExamples.length > 0) {
    lines.push("", "Service duplicate examples:", ...serviceSummary.duplicateExamples.map((item) => `  - ${item}`));
  }

  if (invalidProducts.length > 0) {
    lines.push(
      "",
      "Invalid product row examples:",
      ...invalidProducts.slice(0, 5).map((row) => `  - row ${row.rowNumber}: ${row.invalidReason}`),
    );
  }

  if (invalidServices.length > 0) {
    lines.push(
      "",
      "Invalid service row examples:",
      ...invalidServices.slice(0, 5).map((row) => `  - row ${row.rowNumber}: ${row.invalidReason}`),
    );
  }

  if (!shouldApply) {
    lines.push("", "No database rows were changed. Re-run with --apply to import.");
  }

  console.log(lines.join("\n"));
}

function readArg(name) {
  const prefix = `${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}
