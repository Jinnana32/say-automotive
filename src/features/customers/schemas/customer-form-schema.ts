import { z } from "zod";

import type { CustomerFormValues } from "@/features/customers/types";

const customerTypeSchema = z.enum(["individual", "company", "fleet"]);
const customerStatusSchema = z.enum(["active", "inactive"]);

export const customerFormSchema = z
  .object({
    customerId: z.string().uuid().optional(),
    customerType: customerTypeSchema,
    firstName: z.string().trim(),
    lastName: z.string().trim(),
    companyName: z.string().trim(),
    contactNumber: z.string().trim(),
    contactNumberSecondary: z.string().trim(),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .or(z.literal(""))
      .transform((value) => value.trim()),
    address: z.string().trim(),
    notes: z.string().trim(),
    status: customerStatusSchema,
  })
  .superRefine((value, ctx) => {
    if (value.customerType === "individual") {
      if (!value.firstName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["firstName"],
          message: "First name is required for individual customers.",
        });
      }

      if (!value.lastName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lastName"],
          message: "Last name is required for individual customers.",
        });
      }
    }

    if (value.customerType !== "individual" && !value.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Company or fleet name is required.",
      });
    }
  });

export function deriveCustomerDisplayName(values: CustomerFormValues) {
  if (values.customerType === "individual") {
    return `${values.firstName} ${values.lastName}`.trim();
  }

  return values.companyName.trim();
}

export function parseCustomerFormData(formData: FormData): CustomerFormValues {
  return {
    customerId: readString(formData, "customerId") || undefined,
    customerType: readString(formData, "customerType") as CustomerFormValues["customerType"],
    firstName: readString(formData, "firstName"),
    lastName: readString(formData, "lastName"),
    companyName: readString(formData, "companyName"),
    contactNumber: readString(formData, "contactNumber"),
    contactNumberSecondary: readString(formData, "contactNumberSecondary"),
    email: readString(formData, "email"),
    address: readString(formData, "address"),
    notes: readString(formData, "notes"),
    status: readString(formData, "status") as CustomerFormValues["status"],
  };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
