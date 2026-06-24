import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
}) {
  return (
    <label className={cn("text-sm font-medium text-foreground", className)} {...props}>
      {children}
      {required ? (
        <>
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
          <span className="sr-only"> (required)</span>
        </>
      ) : null}
    </label>
  );
}
