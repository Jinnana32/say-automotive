import { cn } from "@/lib/utils";

export function DataTableScroll({
  children,
  className,
  minWidthClassName = "min-w-[42rem]",
}: {
  children: React.ReactNode;
  className?: string;
  minWidthClassName?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-3 w-[calc(100%+1.5rem)] max-w-none overflow-x-auto overscroll-x-contain sm:-mx-4 sm:w-[calc(100%+2rem)] md:mx-0 md:w-full",
        className,
      )}
    >
      <div className={cn("w-full align-middle", minWidthClassName)}>{children}</div>
    </div>
  );
}
