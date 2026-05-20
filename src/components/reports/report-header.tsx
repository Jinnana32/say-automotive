import { DocumentHeader } from "@/components/reports/document-header";

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
    <DocumentHeader
      businessName={businessName}
      documentTitle={documentTitle}
      documentMeta={documentMeta}
      logoSrc={logoSrc}
    />
  );
}
