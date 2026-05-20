import Image from "next/image";

export function DocumentHeader({
  businessName,
  documentTitle,
  documentMeta,
  logoSrc = "/say-auto-care-logo.jpeg",
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
        compact ? "pb-3" : "pb-4"
      }`}
    >
      <div
        className={`grid gap-3 ${
          compact
            ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)]"
            : "sm:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)]"
        } sm:items-center`}
      >
        <div className="flex min-w-0 items-center">
          <div
            className={`flex max-w-full shrink-0 items-center justify-start ${
              compact ? "w-[180px]" : "w-[220px]"
            }`}
          >
            <Image
              src={logoSrc || "/say-auto-care-logo.jpeg"}
              alt={businessName}
              width={320}
              height={150}
              priority
              unoptimized
              className={`h-auto w-auto object-contain object-left ${
                compact
                  ? "max-h-[68px] max-w-[180px]"
                  : "max-h-[90px] max-w-[220px]"
              }`}
            />
          </div>
        </div>
        <div className="min-w-0 sm:text-right">
          <h1
            className={`break-words font-display font-semibold uppercase tracking-[0.16em] text-brand-navy ${
              compact ? "text-[20px] sm:text-[22px]" : "text-[24px] sm:text-[28px]"
            }`}
          >
            {documentTitle}
          </h1>
          <div
            className={`ml-auto max-w-full bg-brand-red ${
              compact ? "mt-1.5 h-[3px] w-28" : "mt-2 h-[4px] w-40"
            }`}
          />
          {documentMeta ? (
            <p
              className={`max-w-full break-words font-medium text-slate-600 ${
                compact ? "mt-1.5 text-[9.5px] leading-[1.35]" : "mt-2 text-[10px] leading-[1.4]"
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
