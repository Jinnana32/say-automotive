import { cn } from "@/lib/utils";

export function FormStatusMessage({
  message,
}: {
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-[0_10px_20px_rgba(220,38,38,0.05)]">
      {message}
    </div>
  );
}

export function FormRequiredFieldsNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-sm text-slate-500", className)}>
      Fields marked with <span className="text-red-500">*</span> are required.
    </p>
  );
}

export function fieldHasError(
  errors: Record<string, string[] | undefined> | undefined,
  name: string,
) {
  return Boolean(errors?.[name]?.[0]);
}

export function fieldControlClassName(
  errors: Record<string, string[] | undefined> | undefined,
  name: string,
  className?: string,
) {
  return cn(
    className,
    fieldHasError(errors, name) &&
      "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
  );
}

export function fieldAriaProps({
  errors,
  name,
  required = false,
  errorId,
}: {
  errors?: Record<string, string[] | undefined>;
  name: string;
  required?: boolean;
  errorId?: string;
}) {
  const hasError = fieldHasError(errors, name);

  return {
    "aria-required": required ? true : undefined,
    "aria-invalid": hasError ? true : undefined,
    "aria-describedby": hasError && errorId ? errorId : undefined,
  } as const;
}

export function fieldErrorId(fieldId: string) {
  return `${fieldId}-error`;
}

export const FORM_SELECT_CLASS_NAME =
  "flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function formSelectClassName(
  errors: Record<string, string[] | undefined> | undefined,
  name: string,
) {
  return fieldControlClassName(errors, name, FORM_SELECT_CLASS_NAME);
}

export function FieldError({
  errors,
  name,
  id,
}: {
  errors?: Record<string, string[] | undefined>;
  name: string;
  id?: string;
}) {
  const message = errors?.[name]?.[0];

  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}
