import Link from "next/link";

import { ArrowRight, type LucideIcon } from "lucide-react";

import { websiteCardVariants } from "@/features/website/components/website-card-variants";
import { cn } from "@/lib/utils";

export function ServiceCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
  eyebrow,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  cta?: string;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        websiteCardVariants({ variant: "feature" }),
        className,
      )}
    >
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#102b84] text-[#ffd24a] shadow-[0_10px_20px_rgba(16,43,132,0.2)]">
        <Icon className="h-4 w-4" />
      </div>
      {eyebrow ? (
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#173c99]">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-2 text-xl font-semibold leading-tight text-[#10224d] sm:text-[1.35rem]">
        {title}
      </h3>
      <p className="mt-2.5 text-sm leading-6 text-[#4d5f7f]">{description}</p>
      {href && cta ? (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ffd24a] px-4 py-2 text-sm font-semibold text-[#10224d] transition hover:bg-[#ffdc72]"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
