import { describe, expect, it } from "vitest";

import {
  inventoryMovementSchema,
  markInventoryStockDamagedSchema,
  reconcileInventoryStockSchema,
  receiveInventoryStockSchema,
  updateInventoryStockSettingsSchema,
} from "@/features/inventory/schemas/inventory-forms";

describe("inventory form schemas", () => {
  it("accepts stock-in movements through the unified movement schema", () => {
    const parsed = inventoryMovementSchema.safeParse({
      movementMode: "stock_in",
      productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      quantity: "2.5",
      notes: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects negative recount quantities in the unified movement schema", () => {
    const parsed = inventoryMovementSchema.safeParse({
      movementMode: "recount",
      productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      quantity: "-1",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires notes for recount adjustments in the unified movement schema", () => {
    const parsed = inventoryMovementSchema.safeParse({
      movementMode: "recount",
      productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      quantity: "2",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects zero stock-in quantity", () => {
    const parsed = receiveInventoryStockSchema.safeParse({
      productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      quantity: "0",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects negative recount quantities", () => {
    const parsed = reconcileInventoryStockSchema.safeParse({
      productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      countedQuantity: "-1",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires notes for standalone recount adjustments", () => {
    const parsed = reconcileInventoryStockSchema.safeParse({
      productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      countedQuantity: "5",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects zero damaged quantity", () => {
    const parsed = markInventoryStockDamagedSchema.safeParse({
      productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      quantity: "0",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires notes when marking stock as damaged", () => {
    const parsed = markInventoryStockDamagedSchema.safeParse({
      productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      quantity: "1",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects negative reorder levels", () => {
    const parsed = updateInventoryStockSettingsSchema.safeParse({
      productId: "34c25057-b0f8-4da0-9a27-c1792efa2ebd",
      reorderLevel: "-2",
      shelfLocation: "",
    });

    expect(parsed.success).toBe(false);
  });
});
