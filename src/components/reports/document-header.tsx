import { DEFAULT_BRAND_LOGO_TIGHT_SRC } from "@/components/shared/brand-assets";
import { BrandLogo } from "@/components/shared/brand-logo";

export function DocumentHeader({
  businessName,
  documentTitle,
  documentMeta,
  logoSrc = DEFAULT_BRAND_LOGO_TIGHT_SRC,
  compact = false,
}: {
  businessName: string;
  documentTitle: string;
  documentMeta?: string | null;
  logoSrc?: string | null;
  compact?: boolean;
}) {
  return (
    <header
      className={`report-section-keep border-b-2 border-brand-border ${
        compact ? "pb-2.5" : "pb-3.5"
      }`}
    >
      <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-center gap-2.5">
        <div className="flex min-w-0 items-center">
          <div
            className={`flex w-full max-w-full items-center justify-start ${
              compact ? "max-w-[180px]" : "max-w-[210px]"
            }`}
          >
            <BrandLogo
              src={logoSrc || DEFAULT_BRAND_LOGO_TIGHT_SRC}
              alt={businessName}
              width={400}
              height={176}
              priority
              unoptimized
              className={`h-auto w-auto max-w-full object-left ${
                compact
                  ? "max-h-[64px] max-w-[180px]"
                  : "max-h-[84px] max-w-[210px]"
              }`}
            />
          </div>
        </div>
        <div className="min-w-0 text-right">
          <h1
            className={`break-words font-display font-semibold uppercase leading-[1.05] tracking-[0.08em] text-brand-navy ${
              compact ? "text-[17px] sm:text-[19px]" : "text-[20px] sm:text-[22px]"
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
              className={`max-w-full break-words font-medium text-slate-600 ${
                compact ? "mt-1 text-[9.25px] leading-[1.32]" : "mt-1.5 text-[9.75px] leading-[1.36]"
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
