import { describe, expect, it } from "vitest";

import {
  calculateQuotationGrandTotal,
  calculateQuotationLineTotal,
  calculateQuotationSubtotal,
  createQuotationItem,
  dedupeOptionsById,
  resolveQuotationCreateFlowSelection,
} from "@/features/quotations/utils";

describe("quotation utils", () => {
  it("calculates line totals", () => {
    const lineTotal = calculateQuotationLineTotal(
      createQuotationItem({ quantity: "2", unitPrice: "550.505" }),
    );

    expect(lineTotal).toBe(1101.01);
  });

  it("calculates subtotal and grand total", () => {
    const items = [
      createQuotationItem({ quantity: "2", unitPrice: "500" }),
      createQuotationItem({ quantity: "1", unitPrice: "250" }),
    ];

    expect(calculateQuotationSubtotal(items)).toBe(1250);
    expect(calculateQuotationGrandTotal({ items, discount: "100", tax: "12" })).toBe(1162);
  });

  it("prefills the quotation flow from a valid customer selection", () => {
    expect(
      resolveQuotationCreateFlowSelection({
        requestedCustomerId: "customer-1",
        customers: [{ id: "customer-1", label: "Alex Santos" }],
        vehicles: [],
      }),
    ).toEqual({
      customerId: "customer-1",
      vehicleId: "",
    });
  });

  it("prefills the quotation flow from a valid vehicle and derives its customer", () => {
    expect(
      resolveQuotationCreateFlowSelection({
        requestedCustomerId: "customer-2",
        requestedVehicleId: "vehicle-1",
        customers: [
          { id: "customer-1", label: "Alex Santos" },
          { id: "customer-2", label: "Chris Dela Cruz" },
        ],
        vehicles: [
          {
            id: "vehicle-1",
            customerId: "customer-1",
            label: "Toyota Vios · ABC1234",
          },
        ],
      }),
    ).toEqual({
      customerId: "customer-1",
      vehicleId: "vehicle-1",
    });
  });

  it("deduplicates option arrays by id and keeps the latest entry", () => {
    expect(
      dedupeOptionsById([
        { id: "product-1", label: "Old label" },
        { id: "product-2", label: "Battery" },
        { id: "product-1", label: "Updated label" },
      ]),
    ).toEqual([
      { id: "product-1", label: "Updated label" },
      { id: "product-2", label: "Battery" },
    ]);
  });
});
