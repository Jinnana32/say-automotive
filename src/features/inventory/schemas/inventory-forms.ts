import { z } from "zod";

export const inventoryMovementModeSchema = z.enum(["stock_in", "recount", "damaged"], {
  message: "Movement approach is required.",
});

export const inventoryMovementSchema = z
  .object({
    movementMode: inventoryMovementModeSchema,
    productId: z.string().uuid("Product is required."),
    quantity: z.string().trim(),
    notes: z.string().trim().max(500, "Notes are too long."),
  })
  .superRefine((value, ctx) => {
    const numericQuantity = Number(value.quantity);
    const isValidNumber = Number.isFinite(numericQuantity);
    const isValidQuantity =
      value.movementMode === "recount"
        ? isValidNumber && numericQuantity >= 0
        : isValidNumber && numericQuantity > 0;

    if (!isValidQuantity) {
      ctx.addIssue({
        code: "custom",
        message:
          value.movementMode === "recount"
            ? "Counted quantity must be zero or greater."
            : value.movementMode === "damaged"
              ? "Damaged quantity must be greater than zero."
              : "Quantity must be greater than zero.",
        path: ["quantity"],
      });
    }
  });

export const receiveInventoryStockSchema = z.object({
  productId: z.string().uuid("Product is required."),
  quantity: z
    .string()
    .trim()
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
      "Quantity must be greater than zero.",
    ),
  notes: z.string().trim().max(500, "Notes are too long."),
});

export const reconcileInventoryStockSchema = z.object({
  productId: z.string().uuid("Product is required."),
  countedQuantity: z
    .string()
    .trim()
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
      "Counted quantity must be zero or greater.",
    ),
  notes: z.string().trim().max(500, "Notes are too long."),
});

export const markInventoryStockDamagedSchema = z.object({
  productId: z.string().uuid("Product is required."),
  quantity: z
    .string()
    .trim()
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
      "Damaged quantity must be greater than zero.",
    ),
  notes: z.string().trim().max(500, "Notes are too long."),
});

export const updateInventoryStockSettingsSchema = z.object({
  productId: z.string().uuid("Product is required."),
  reorderLevel: z
    .string()
    .trim()
    .refine(
      (value) => !value || (Number.isFinite(Number(value)) && Number(value) >= 0),
      "Reorder level must be zero or greater.",
    ),
  shelfLocation: z.string().trim().max(120, "Shelf location is too long."),
});

export function parseReceiveInventoryStockFormData(formData: FormData) {
  return {
    productId: readString(formData, "productId"),
    quantity: readString(formData, "quantity"),
    notes: readString(formData, "notes"),
  };
}

export function parseInventoryMovementFormData(formData: FormData) {
  return {
    movementMode: readString(formData, "movementMode"),
    productId: readString(formData, "productId"),
    quantity: readString(formData, "quantity"),
    notes: readString(formData, "notes"),
  };
}

export function parseReconcileInventoryStockFormData(formData: FormData) {
  return {
    productId: readString(formData, "productId"),
    countedQuantity: readString(formData, "countedQuantity"),
    notes: readString(formData, "notes"),
  };
}

export function parseMarkInventoryStockDamagedFormData(formData: FormData) {
  return {
    productId: readString(formData, "productId"),
    quantity: readString(formData, "quantity"),
    notes: readString(formData, "notes"),
  };
}

export function parseUpdateInventoryStockSettingsFormData(formData: FormData) {
  return {
    productId: readString(formData, "productId"),
    reorderLevel: readString(formData, "reorderLevel"),
    shelfLocation: readString(formData, "shelfLocation"),
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
