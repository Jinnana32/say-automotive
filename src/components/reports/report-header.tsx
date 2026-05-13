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
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex w-16 shrink-0 items-center justify-center">
            <Image
              src={logoSrc}
              alt={businessName}
              width={120}
              height={64}
              priority
              unoptimized
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-display text-[12px] font-semibold uppercase tracking-[0.28em] text-[#173c99]">
              {businessName}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="font-display text-[23px] font-semibold uppercase tracking-[0.16em] text-[#10224d]">
            {documentTitle}
          </h1>
          <div className="ml-auto mt-1 h-[3px] w-44 bg-[#c73d3d]" />
          {documentMeta ? (
            <p className="mt-1 text-[10px] font-medium text-slate-600">{documentMeta}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 h-px bg-slate-300" />
    </header>
  );
}
