import type { ProductInlineCreateResult } from "@/features/products/types";

export type InlineProductActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  product?: ProductInlineCreateResult;
};

export const INITIAL_INLINE_PRODUCT_ACTION_STATE: InlineProductActionState = {
  status: "idle",
};
