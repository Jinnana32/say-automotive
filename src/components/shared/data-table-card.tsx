import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils";

export function DataTableCard({
  title,
  description,
  action,
  toolbar,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <SectionCard
      title={title}
      description={description}
      action={action}
      className={className}
      contentClassName="p-0"
    >
      {toolbar ? <div className="border-b border-border/70 p-4">{toolbar}</div> : null}
      <div className={cn("p-4", contentClassName)}>{children}</div>
    </SectionCard>
  );
}
