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
        compact ? "pb-2.5" : "pb-3"
      }`}
    >
      <div
        className={`grid gap-2.5 ${
          compact
            ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)]"
            : "sm:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)]"
        } sm:items-center`}
      >
        <div className="flex min-w-0 items-center">
          <div
            className={`flex max-w-full shrink-0 items-center justify-start ${
              compact ? "w-[176px]" : "w-[208px]"
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
                  ? "max-h-[64px] max-w-[176px]"
                  : "max-h-[84px] max-w-[208px]"
              }`}
            />
          </div>
        </div>
        <div className="min-w-0 sm:text-right">
          <h1
            className={`break-words font-display font-semibold uppercase tracking-[0.16em] text-brand-navy ${
              compact ? "text-[19px] sm:text-[21px]" : "text-[23px] sm:text-[26px]"
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
