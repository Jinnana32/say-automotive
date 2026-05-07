import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <SectionCard
      title={title}
      description={description}
      className={className}
      contentClassName={cn("p-5", contentClassName)}
    >
      {children}
    </SectionCard>
  );
}
