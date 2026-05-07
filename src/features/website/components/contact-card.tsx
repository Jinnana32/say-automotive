import { type LucideIcon } from "lucide-react";

import { websiteCardVariants } from "@/features/website/components/website-card-variants";
import { cn } from "@/lib/utils";

export function ContactCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  action,
  className,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        websiteCardVariants({ variant: "feature" }),
        className,
      )}
    >
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffd24a] text-[#102b84]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#173c99]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold leading-tight text-[#10224d] sm:text-[1.7rem]">
        {title}
      </h2>
      {description ? <p className="mt-3 text-sm leading-6 text-[#4d5f7f]">{description}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
