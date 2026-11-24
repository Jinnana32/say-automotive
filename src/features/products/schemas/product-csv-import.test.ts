import { describe, expect, it } from "vitest";

import {
  PRODUCT_CSV_TEMPLATE,
  parseCsv,
  parseProductCsvText,
} from "@/features/products/schemas/product-csv-import";

describe("product csv import", () => {
  it("parses quoted commas and escapes", () => {
    const rows = parseCsv('name,unit\n"Oil, Filter",Piece\n');
    expect(rows).toEqual([
      ["name", "unit"],
      ["Oil, Filter", "Piece"],
    ]);
  });

  it("parses the product template into valid rows", () => {
    const parsed = parseProductCsvText(PRODUCT_CSV_TEMPLATE);

    expect(parsed.fatalError).toBeNull();
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]?.errors).toEqual([]);
    expect(parsed.rows[0]?.values?.name).toBe("Engine Oil Filter");
    expect(parsed.rows[0]?.values?.productType).toBe("part");
    expect(parsed.rows[1]?.values?.name).toBe("Brake Fluid DOT 4");
    expect(parsed.rows[1]?.values?.productType).toBe("fluid");
  });

  it("rejects files without required headers", () => {
    const parsed = parseProductCsvText("name,sku\nFilter,SKU-1\n");
    expect(parsed.fatalError).toMatch(/unit/i);
    expect(parsed.fatalError).toMatch(/Found:/i);
  });

  it("parses semicolon-delimited Excel-style CSV", () => {
    const parsed = parseProductCsvText(
      "name;product_type;unit;cost_price;selling_price\nOil Filter;part;Piece;10;20\n",
    );

    expect(parsed.fatalError).toBeNull();
    expect(parsed.rows[0]?.values?.name).toBe("Oil Filter");
    expect(parsed.rows[0]?.values?.unit).toBe("Piece");
  });

  it("parses SAY inventory Products CSV without product_type", () => {
    const parsed = parseProductCsvText(
      [
        "Product ID,Product Name,Category,Brand,Part No.,OEM No.,Barcode,Unit,Cost Price,Selling Price,Current Stock,Reorder Level,Stock Status,Stock Value,Location,Supplier,Last Updated,Notes",
        'PRD-0327,Brembo Brake Pads- Toyota Vios,Brake System,Brembo,P83165N,,,Set,,"₱2,200.0000",2,,In Stock,₱0.0000,,Iloilo Auto Supply,,',
      ].join("\n"),
    );

    expect(parsed.fatalError).toBeNull();
    expect(parsed.rows[0]?.errors).toEqual([]);
    expect(parsed.rows[0]?.values?.name).toBe("Brembo Brake Pads- Toyota Vios");
    expect(parsed.rows[0]?.values?.productType).toBe("part");
    expect(parsed.rows[0]?.values?.unit).toBe("Set");
    expect(parsed.rows[0]?.values?.sku).toBe("P83165N");
    expect(parsed.rows[0]?.values?.sellingPrice).toBe("2200.0000");
    expect(parsed.rows[0]?.values?.costPrice).toBe("0.0000");
    expect(parsed.rows[0]?.values?.supplier).toBe("Iloilo Auto Supply");
  });

  it("collects per-row validation errors", () => {
    const parsed = parseProductCsvText(
      "name,product_type,unit,cost_price,selling_price\n,part,Piece,10,20\n",
    );

    expect(parsed.fatalError).toBeNull();
    expect(parsed.rows[0]?.errors.join(" ")).toMatch(/name/i);
  });
});
