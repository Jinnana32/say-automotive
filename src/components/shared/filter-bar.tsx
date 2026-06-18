import { cn } from "@/lib/utils";

export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 max-w-full flex-col gap-3 rounded-2xl border border-border/80 bg-muted/20 p-3 lg:flex-row lg:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
