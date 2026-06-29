import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  optional,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
  optional?: boolean;
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
      {!required && optional ? (
        <span className="ml-2 text-xs font-normal text-slate-400">(Optional)</span>
      ) : null}
    </label>
  );
}
