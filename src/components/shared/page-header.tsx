export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:shrink-0 md:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
