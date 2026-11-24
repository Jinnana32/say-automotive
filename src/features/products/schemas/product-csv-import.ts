import { z } from "zod";

import { isNonNegativeMoneyInput } from "@/lib/currency";
import type { ProductStatus, ProductType } from "@/features/products/types";

export const PRODUCT_CSV_HEADERS = [
  "name",
  "sku",
  "barcode",
  "product_type",
  "unit",
  "category",
  "brand",
  "supplier",
  "cost_price",
  "selling_price",
  "reorder_level",
  "part_number",
  "oem_number",
  "description",
  "shelf_location",
  "status",
  "share_globally",
] as const;

export const PRODUCT_CSV_TEMPLATE = `${PRODUCT_CSV_HEADERS.join(",")}
Engine Oil Filter,SKU-001,BC001,part,Piece,Filters,Bosch,AutoParts Co,120.0000,250.0000,5,OF-123,OEM-456,Oil filter for common sedans,Aisle A,active,false
"Brake Fluid DOT 4",,,fluid,Liter,Fluids,,,350.0000,480.0000,2,,,Brake fluid,Aisle B,active,false
`;

export const PRODUCT_CSV_MAX_ROWS = 500;

const productTypeSchema = z.enum([
  "part",
  "fluid",
  "consumable",
  "accessory",
  "tool",
]);

const productStatusSchema = z.enum(["active", "inactive"]);

export const productCsvRowSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  sku: z.string().trim(),
  barcode: z.string().trim(),
  productType: productTypeSchema,
  unit: z.string().trim().min(1, "Unit is required."),
  category: z.string().trim(),
  brand: z.string().trim(),
  supplier: z.string().trim(),
  costPrice: z
    .string()
    .trim()
    .refine(isNonNegativeMoneyInput, "Cost price must be zero or greater with up to 4 decimal places."),
  sellingPrice: z
    .string()
    .trim()
    .refine(
      isNonNegativeMoneyInput,
      "Selling price must be zero or greater with up to 4 decimal places.",
    ),
  reorderLevel: z
    .string()
    .trim()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Reorder level must be zero or greater.",
    ),
  partNumber: z.string().trim(),
  oemNumber: z.string().trim(),
  description: z.string().trim(),
  shelfLocation: z.string().trim(),
  status: productStatusSchema.default("active"),
  shareGlobally: z.boolean().default(false),
});

export type ProductCsvRowValues = z.infer<typeof productCsvRowSchema>;

export type ParsedProductCsvRow = {
  rowNumber: number;
  raw: Record<string, string>;
  values: ProductCsvRowValues | null;
  errors: string[];
};

export function parseProductCsvText(csvText: string): {
  rows: ParsedProductCsvRow[];
  fatalError: string | null;
} {
  const delimiter = detectCsvDelimiter(csvText);
  const table = parseCsv(csvText, delimiter);

  if (table.length === 0) {
    return { rows: [], fatalError: "CSV file is empty." };
  }

  const [headerRow, ...dataRows] = table;
  const normalizedHeaders = headerRow.map(normalizeHeader);

  if (!normalizedHeaders.includes("name") || !normalizedHeaders.includes("unit")) {
    const found =
      normalizedHeaders.filter(Boolean).slice(0, 12).join(", ") || "(no headers detected)";
    return {
      rows: [],
      fatalError:
        `CSV must include name and unit columns. Found: ${found}. ` +
        "Use Download template, or a SAY inventory Products CSV with Product Name + Unit.",
    };
  }

  if (!normalizedHeaders.includes("selling_price") && !normalizedHeaders.includes("cost_price")) {
    return {
      rows: [],
      fatalError:
        "CSV must include selling_price (or Cost Price / Selling Price from the inventory export).",
    };
  }

  if (dataRows.length === 0) {
    return { rows: [], fatalError: "CSV has a header row but no product rows." };
  }

  if (dataRows.length > PRODUCT_CSV_MAX_ROWS) {
    return {
      rows: [],
      fatalError: `CSV has ${dataRows.length} rows. Import up to ${PRODUCT_CSV_MAX_ROWS} products at a time.`,
    };
  }

  const rows = dataRows.map((cells, index) => {
    const raw = mapRowToObject(normalizedHeaders, cells);
    const partNumber = (raw.part_number ?? "").trim();
    const productId = (raw.product_id ?? "").trim();
    const category = (raw.category ?? "").trim();
    const explicitType = (raw.product_type ?? "").trim().toLowerCase();
    const candidate = {
      name: raw.name ?? "",
      sku: (raw.sku ?? "").trim() || partNumber || productId,
      barcode: raw.barcode ?? "",
      productType: explicitType || inferProductType(category),
      unit: (raw.unit ?? "").trim() || "Piece",
      category,
      brand: raw.brand ?? "",
      supplier: raw.supplier ?? "",
      costPrice: normalizeMoneyCell(raw.cost_price),
      sellingPrice: normalizeMoneyCell(raw.selling_price),
      reorderLevel: normalizeNumericCell(raw.reorder_level, "0"),
      partNumber,
      oemNumber: raw.oem_number ?? "",
      description: raw.description ?? "",
      shelfLocation: raw.shelf_location ?? "",
      status: normalizeStatus(raw.status),
      shareGlobally: parseBoolean(raw.share_globally),
    };

    const parsed = productCsvRowSchema.safeParse(candidate);
    if (!parsed.success) {
      return {
        rowNumber: index + 2,
        raw,
        values: null,
        errors: parsed.error.issues.map((issue) => issue.message),
      } satisfies ParsedProductCsvRow;
    }

    return {
      rowNumber: index + 2,
      raw,
      values: parsed.data,
      errors: [],
    } satisfies ParsedProductCsvRow;
  });

  return { rows, fatalError: null };
}

function normalizeHeader(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[./]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  // System template + SAY inventory export aliases
  switch (normalized) {
    case "product_name":
    case "item_name":
      return "name";
    case "product_id":
      return "product_id";
    case "type":
    case "item_type":
      return "product_type";
    case "uom":
    case "unit_of_measure":
    case "base_unit":
      return "unit";
    case "cost":
    case "cost_price_php":
      return "cost_price";
    case "price":
    case "selling_price_php":
    case "unit_price":
      return "selling_price";
    case "part_no":
    case "part_number":
    case "part_num":
      return "part_number";
    case "oem_no":
    case "oem_number":
    case "oem_num":
      return "oem_number";
    case "location":
    case "shelf_location":
      return "shelf_location";
    case "notes":
    case "description":
      return "description";
    default:
      return normalized;
  }
}

/** Match the offline inventory importer: fluids/tools/accessories from category, else part. */
export function inferProductType(category: string): ProductType {
  const normalized = category.trim().toLowerCase().replace(/\s+/g, " ");

  if (normalized.includes("lubricant") || normalized.includes("fluid")) {
    return "fluid";
  }
  if (normalized.includes("accessor") || normalized.includes("mags")) {
    return "accessory";
  }
  if (normalized.includes("tool")) {
    return "tool";
  }
  if (normalized.includes("consumable")) {
    return "consumable";
  }

  return "part";
}

function normalizeMoneyCell(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "0.0000";
  }

  // Accept "₱2,200.0000" and similar spreadsheet currency formatting.
  const cleaned = trimmed.replace(/[₱,\s]/g, "").replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") {
    return "0.0000";
  }

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return trimmed;
  }

  return parsed.toFixed(4);
}

function normalizeNumericCell(value: string | undefined, fallback: string) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return fallback;
  }

  const cleaned = trimmed.replace(/,/g, "");
  return cleaned || fallback;
}

/** Excel locales often re-save CSV with semicolons or tabs instead of commas. */
export function detectCsvDelimiter(text: string): "," | ";" | "\t" {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/).find((line) => line.trim()) ?? "";
  const commaCount = countUnquoted(firstLine, ",");
  const semicolonCount = countUnquoted(firstLine, ";");
  const tabCount = countUnquoted(firstLine, "\t");

  if (semicolonCount > commaCount && semicolonCount >= tabCount) {
    return ";";
  }
  if (tabCount > commaCount && tabCount >= semicolonCount) {
    return "\t";
  }
  return ",";
}

function countUnquoted(line: string, delimiter: string) {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char === delimiter) {
      count += 1;
    }
  }

  return count;
}

function normalizeStatus(value: string | undefined): ProductStatus {
  const normalized = (value ?? "active").trim().toLowerCase();
  return normalized === "inactive" ? "inactive" : "active";
}

function parseBoolean(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y";
}

function mapRowToObject(headers: string[], cells: string[]) {
  const result: Record<string, string> = {};

  headers.forEach((header, index) => {
    if (!header) {
      return;
    }
    result[header] = cells[index] ?? "";
  });

  return result;
}

/** Minimal RFC4180-style CSV parser (quoted fields, CRLF/LF). */
export function parseCsv(text: string, delimiter: "," | ";" | "\t" = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = false;
        continue;
      }

      field += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

export function isProductType(value: string): value is ProductType {
  return productTypeSchema.safeParse(value).success;
}
