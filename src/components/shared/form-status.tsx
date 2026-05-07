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

export function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[] | undefined>;
  name: string;
}) {
  const message = errors?.[name]?.[0];

  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}
