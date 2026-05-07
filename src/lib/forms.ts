import { z } from "zod";

export type FormActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const INITIAL_FORM_ACTION_STATE: FormActionState = {
  status: "idle",
};

export function toFormActionState(
  error: z.ZodError,
  message = "Please correct the highlighted fields and try again.",
): FormActionState {
  return {
    status: "error",
    message,
    fieldErrors: error.flatten().fieldErrors,
  };
}
