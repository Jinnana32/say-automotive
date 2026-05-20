import type { ServiceInlineCreateResult } from "@/features/services/types";

export type InlineServiceActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  service?: ServiceInlineCreateResult;
};

export const INITIAL_INLINE_SERVICE_ACTION_STATE: InlineServiceActionState = {
  status: "idle",
};
