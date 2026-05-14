import Image from "next/image";

export function ReportHeader({
  businessName,
  documentTitle,
  documentMeta,
  logoSrc = "/say-auto-care-logo.jpeg",
}: {
  businessName: string;
  documentTitle: string;
  documentMeta?: string | null;
  logoSrc?: string;
}) {
  return (
    <header className="report-section-keep">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center">
          <div className="flex w-[180px] shrink-0 items-center justify-start">
            <Image
              src={logoSrc}
              alt={businessName}
              width={240}
              height={112}
              priority
              unoptimized
              className="h-16 w-auto max-w-[180px] object-contain object-left"
            />
          </div>
        </div>
        <div className="text-right">
          <h1 className="font-display text-[23px] font-semibold uppercase tracking-[0.16em] text-brand-navy">
            {documentTitle}
          </h1>
          <div className="ml-auto mt-1 h-[3px] w-44 bg-brand-red" />
          {documentMeta ? (
            <p className="mt-1 text-[10px] font-medium text-slate-600">{documentMeta}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 h-px bg-brand-border" />
    </header>
  );
}
