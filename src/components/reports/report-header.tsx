import Image from "next/image";

export function ReportHeader({
  businessName,
  documentTitle,
  eyebrow = "SAY Automotive - Job Quotation",
  logoSrc = "/say-auto-care-logo.jpeg",
}: {
  businessName: string;
  documentTitle: string;
  eyebrow?: string;
  logoSrc?: string;
}) {
  return (
    <header className="report-section-keep">
      <p className="text-right text-[9px] text-slate-500">{eyebrow}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex w-20 shrink-0 items-center justify-center">
          <Image
            src={logoSrc}
            alt={businessName}
            width={140}
            height={80}
            priority
            unoptimized
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="border border-[#173c99]">
            <div className="h-1.5 bg-[#173c99]" />
            <div className="bg-[#ffd24a] px-3 py-1.5">
              <p className="font-display text-xl font-semibold uppercase tracking-[0.08em] text-[#10224d]">
                {businessName}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <h1 className="font-display text-[21px] font-semibold text-slate-950">{documentTitle}</h1>
      </div>
    </header>
  );
}
