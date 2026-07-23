import { describe, expect, it } from "vitest";

import {
  getQuotationLineCatalogDraftLabel,
  getQuotationLineCatalogIssues,
  mergeQuotationCatalogIntoFormOptions,
} from "@/features/quotations/line-item-catalog";
import { createQuotationItem } from "@/features/quotations/utils";

describe("getQuotationLineCatalogIssues", () => {
  it("flags product lines without a catalog product id", () => {
    const issues = getQuotationLineCatalogIssues([
      createQuotationItem({
        key: "line-1",
        itemType: "product",
        description: "Relay",
        productId: "",
      }),
    ]);

    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("Relay");
    expect(issues[0]?.message).toContain("Create New Product");
  });

  it("ignores labor lines", () => {
    const issues = getQuotationLineCatalogIssues([
      createQuotationItem({
        itemType: "labor",
        description: "Custom labor",
        productId: "",
        serviceId: "",
      }),
    ]);

    expect(issues).toHaveLength(0);
  });
});

describe("getQuotationLineCatalogDraftLabel", () => {
  it("returns description text for unlinked catalog lines", () => {
    expect(
      getQuotationLineCatalogDraftLabel(
        createQuotationItem({
          itemType: "product",
          description: "Relay",
          productId: "",
        }),
      ),
    ).toBe("Relay");
  });
});

describe("mergeQuotationCatalogIntoFormOptions", () => {
  it("keeps linked products and services selectable even when missing from active lists", () => {
    const merged = mergeQuotationCatalogIntoFormOptions(
      { products: [], services: [] },
      [
        createQuotationItem({
          itemType: "product",
          productId: "product-1",
          description: "Relay",
          unitPrice: "175",
        }),
        createQuotationItem({
          itemType: "service",
          serviceId: "service-1",
          description: "Oil Change",
          unitPrice: "1200",
        }),
      ],
      {
        products: [
          {
            id: "product-1",
            label: "Relay",
            sku: "RLY-1",
            unitPrice: 175,
          },
        ],
        services: [
          {
            id: "service-1",
            label: "Oil Change",
            category: "Maintenance",
            unitPrice: 1200,
          },
        ],
      },
    );

    expect(merged.products).toEqual([
      expect.objectContaining({ id: "product-1", label: "Relay" }),
    ]);
    expect(merged.services).toEqual([
      expect.objectContaining({ id: "service-1", label: "Oil Change" }),
    ]);
  });
});
