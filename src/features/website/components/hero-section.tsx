import { PageHeader } from "@/features/website/components/page-header";
import { SectionContainer } from "@/features/website/components/section-container";
import { cn } from "@/lib/utils";

export function HeroSection({
  eyebrow,
  title,
  description,
  actions,
  children,
  aside,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <SectionContainer tone="navy" width="default" spacing="hero" className={className}>
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-8">
        <div className="space-y-5 sm:space-y-6">
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            actions={actions}
            align="left"
            inverse
            titleTag="h1"
            size="hero"
          />
          {children}
        </div>
        {aside ? (
          <div
            className={cn(
              "overflow-hidden rounded-[1.75rem] border border-white/10 bg-white p-4 text-[#10224d] shadow-[0_24px_48px_rgba(6,18,58,0.32)] sm:p-6",
            )}
          >
            {aside}
          </div>
        ) : null}
      </div>
    </SectionContainer>
  );
}
