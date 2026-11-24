import type { ReactNode } from "react";

import { DEFAULT_BRAND_LOGO_TIGHT_SRC } from "@/components/shared/brand-assets";
import { BrandLogo } from "@/components/shared/brand-logo";

/** Keep logo size identical on first and continuation pages (compact only tightens type/padding). */
const PRINT_LOGO_FRAME_CLASS = "flex w-full max-w-[200px] items-center justify-start";
const PRINT_LOGO_IMAGE_CLASS =
  "h-auto w-auto max-h-[84px] max-w-[200px] object-left";

export function DocumentHeader({
  businessName,
  documentTitle,
  documentMeta,
  logoSrc = DEFAULT_BRAND_LOGO_TIGHT_SRC,
  compact = false,
  stacked = false,
}: {
  businessName: string;
  documentTitle: string;
  documentMeta?: ReactNode;
  logoSrc?: string | null;
  compact?: boolean;
  stacked?: boolean;
}) {
  const logo = (
    <BrandLogo
      src={logoSrc || DEFAULT_BRAND_LOGO_TIGHT_SRC}
      alt={businessName}
      width={400}
      height={176}
      priority
      unoptimized
      className={PRINT_LOGO_IMAGE_CLASS}
    />
  );

  if (stacked) {
    return (
      <header className="report-section-keep border-b-2 border-brand-border pb-2.5">
        <div className="space-y-2.5">
          <div className={PRINT_LOGO_FRAME_CLASS}>{logo}</div>
          <div className="min-w-0">
            <h1 className="max-w-full break-words font-display text-[20px] font-semibold uppercase leading-[1.08] tracking-[0.04em] text-brand-navy [overflow-wrap:anywhere]">
              {documentTitle}
            </h1>
            <div className="mt-1 h-[3px] w-24 max-w-full bg-brand-red" />
            {documentMeta ? (
              <p className="mt-1 max-w-full break-words text-[11px] font-medium leading-[1.32] text-slate-600 [overflow-wrap:anywhere]">
                {documentMeta}
              </p>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`report-section-keep border-b-2 border-brand-border ${
        compact ? "pb-2.5" : "pb-3.5"
      }`}
    >
      <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-center gap-3">
        <div className="flex min-w-0 items-center">
          <div className={PRINT_LOGO_FRAME_CLASS}>{logo}</div>
        </div>
        <div className="min-w-0 overflow-hidden text-right">
          <h1
            className={`max-w-full break-words font-display font-semibold uppercase leading-[1.05] tracking-[0.05em] text-brand-navy [overflow-wrap:anywhere] ${
              compact ? "text-[18px] sm:text-[20px]" : "text-[20px] sm:text-[23px]"
            }`}
          >
            {documentTitle}
          </h1>
          <div
            className={`ml-auto max-w-full bg-brand-red ${
              compact ? "mt-1 h-[3px] w-24" : "mt-1.5 h-[4px] w-36"
            }`}
          />
          {documentMeta ? (
            <p
              className={`max-w-full break-words font-medium text-slate-600 [overflow-wrap:anywhere] ${
                compact ? "mt-1 text-[11px] leading-[1.32]" : "mt-1.5 text-[11.75px] leading-[1.36]"
              }`}
            >
              {documentMeta}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
