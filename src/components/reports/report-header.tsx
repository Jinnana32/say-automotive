import { DocumentHeader } from "@/components/reports/document-header";
import { DEFAULT_BRAND_LOGO_TIGHT_SRC } from "@/components/shared/brand-assets";

export function ReportHeader({
  businessName,
  documentTitle,
  documentMeta,
  logoSrc = DEFAULT_BRAND_LOGO_TIGHT_SRC,
}: {
  businessName: string;
  documentTitle: string;
  documentMeta?: string | null;
  logoSrc?: string;
}) {
  return (
    <DocumentHeader
      businessName={businessName}
      documentTitle={documentTitle}
      documentMeta={documentMeta}
      logoSrc={logoSrc}
    />
  );
}
