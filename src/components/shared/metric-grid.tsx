import { cn } from "@/lib/utils";

export function MetricGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("grid w-full min-w-0 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}
