import { PageHeader } from "@/features/website/components/page-header";
import { SectionContainer } from "@/features/website/components/section-container";
import { cn } from "@/lib/utils";

export function CTASection({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <SectionContainer tone="navy" spacing="compact" className={className}>
      <div className="rounded-2xl border border-white/12 bg-white/10 px-5 py-7 shadow-[0_24px_50px_rgba(5,14,44,0.24)] backdrop-blur sm:px-7 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            align="left"
            inverse
            className="max-w-3xl"
          />
          <div className="flex flex-wrap gap-4">{actions}</div>
        </div>
        {aside ? <div className={cn("mt-6")}>{aside}</div> : null}
      </div>
    </SectionContainer>
  );
}
