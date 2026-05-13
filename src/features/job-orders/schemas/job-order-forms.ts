import { z } from "zod";
import { isNonNegativeMoneyInput } from "@/lib/currency";

export const jobOrderDetailsSchema = z
  .object({
    jobOrderId: z.string().uuid("Job order is required."),
    mileageIn: z.string(),
    mileageOut: z.string(),
    customerConcern: z.string().trim().max(2000, "Customer concern is too long."),
    inspectionNotes: z.string().trim().max(4000, "Inspection notes are too long."),
    diagnosis: z.string().trim().max(4000, "Diagnosis is too long."),
    workPerformed: z.string().trim().max(4000, "Work performed is too long."),
  })
  .superRefine((value, ctx) => {
    const mileageIn = parseOptionalNumeric(value.mileageIn);
    const mileageOut = parseOptionalNumeric(value.mileageOut);

    if (mileageIn !== null && mileageIn < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mileage in must be zero or greater.",
        path: ["mileageIn"],
      });
    }

    if (mileageOut !== null && mileageOut < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mileage out must be zero or greater.",
        path: ["mileageOut"],
      });
    }

    if (mileageIn !== null && mileageOut !== null && mileageOut < mileageIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mileage out cannot be less than mileage in.",
        path: ["mileageOut"],
      });
    }
  });

export const jobOrderStatusTransitionSchema = z.object({
  jobOrderId: z.string().uuid("Job order is required."),
  nextStatus: z.enum([
    "pending",
    "in_progress",
    "waiting_for_parts",
    "waiting_for_customer_approval",
    "completed",
    "ready_for_billing",
    "paid",
    "released",
    "cancelled",
  ]),
});

export const mechanicAssignmentSchema = z.object({
  jobOrderId: z.string().uuid("Job order is required."),
  staffId: z.string().uuid("Mechanic is required."),
  taskDescription: z.string().trim().max(500, "Task description is too long."),
});

export const additionalJobOrderItemSchema = z
  .object({
    jobOrderId: z.string().uuid("Job order is required."),
    itemType: z.enum(["product", "service", "labor"]),
    productId: z.string(),
    serviceId: z.string(),
    description: z.string().trim().min(1, "Description is required.").max(500, "Description is too long."),
    quantity: z.string(),
    unitPrice: z.string(),
  })
  .superRefine((value, ctx) => {
    const quantity = Number(value.quantity);
    const unitPrice = Number(value.unitPrice);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quantity must be greater than zero.",
        path: ["quantity"],
      });
    }

    if (!isNonNegativeMoneyInput(value.unitPrice) || !Number.isFinite(unitPrice) || unitPrice < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unit price must be zero or greater with up to 2 decimal places.",
        path: ["unitPrice"],
      });
    }

    if (value.itemType === "product" && !value.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a product.",
        path: ["productId"],
      });
    }

    if (value.itemType === "service" && !value.serviceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a service.",
        path: ["serviceId"],
      });
    }
  });

export const jobOrderPartUsageSchema = z.object({
  jobOrderId: z.string().uuid("Job order is required."),
  jobOrderItemId: z.string().uuid("Job order item is required."),
  quantity: z
    .string()
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, "Quantity must be greater than zero."),
  notes: z.string().trim().max(500, "Notes are too long."),
});

export function parseJobOrderDetailsFormData(formData: FormData) {
  return {
    jobOrderId: readString(formData, "jobOrderId"),
    mileageIn: readString(formData, "mileageIn"),
    mileageOut: readString(formData, "mileageOut"),
    customerConcern: readString(formData, "customerConcern"),
    inspectionNotes: readString(formData, "inspectionNotes"),
    diagnosis: readString(formData, "diagnosis"),
    workPerformed: readString(formData, "workPerformed"),
  };
}

export function parseJobOrderStatusTransitionFormData(formData: FormData) {
  return {
    jobOrderId: readString(formData, "jobOrderId"),
    nextStatus: readString(formData, "nextStatus"),
  };
}

export function parseMechanicAssignmentFormData(formData: FormData) {
  return {
    jobOrderId: readString(formData, "jobOrderId"),
    staffId: readString(formData, "staffId"),
    taskDescription: readString(formData, "taskDescription"),
  };
}

export function parseAdditionalJobOrderItemFormData(formData: FormData) {
  return {
    jobOrderId: readString(formData, "jobOrderId"),
    itemType: readString(formData, "itemType"),
    productId: readString(formData, "productId"),
    serviceId: readString(formData, "serviceId"),
    description: readString(formData, "description"),
    quantity: readString(formData, "quantity"),
    unitPrice: readString(formData, "unitPrice"),
  };
}

export function parseJobOrderPartUsageFormData(formData: FormData) {
  return {
    jobOrderId: readString(formData, "jobOrderId"),
    jobOrderItemId: readString(formData, "jobOrderItemId"),
    quantity: readString(formData, "quantity"),
    notes: readString(formData, "notes"),
  };
}

export function parseOptionalNumeric(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
