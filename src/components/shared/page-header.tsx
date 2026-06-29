import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  titleClassName,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  titleClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0 space-y-1">
        <h1
          className={cn(
            "text-[1.75rem] font-semibold tracking-tight text-foreground",
            titleClassName,
          )}
        >
          {title}
        </h1>
        {description ? (
          <div className="text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:shrink-0 xl:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
