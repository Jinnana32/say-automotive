import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  headerClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {title || description || action ? (
        <CardHeader className={cn("border-b border-border/70 pb-4", headerClassName)}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {title ? <CardTitle>{title}</CardTitle> : null}
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </CardHeader>
      ) : null}
      <CardContent className={cn("p-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
