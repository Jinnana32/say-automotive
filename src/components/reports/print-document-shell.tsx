import type { ReactNode } from "react";

import { DocumentFooter } from "@/components/reports/document-footer";
import { DocumentHeader } from "@/components/reports/document-header";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import type { PrintDocumentBusinessProfile } from "@/components/reports/print-document-page";

/**
 * Wraps explicit print pages with a single header/footer used as fixed print runners.
 * In-flow chrome on each PrintDocumentPage remains for on-screen preview.
 */
export function PrintDocumentShell({
  businessProfile,
  documentTitle,
  documentMeta,
  children,
  className,
}: {
  businessProfile: PrintDocumentBusinessProfile;
  documentTitle: string;
  documentMeta?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <PrintPageStack
      className={className}
      runningHeader={
        <div className="px-[8mm] pt-[2mm]">
          <DocumentHeader
            businessName={businessProfile.businessName}
            documentTitle={documentTitle}
            documentMeta={documentMeta}
            logoSrc={businessProfile.businessLogoUrl}
            compact
          />
        </div>
      }
      runningFooter={
        <div className="px-[8mm] pb-[2mm]">
          <DocumentFooter
            businessName={businessProfile.businessName}
            vatRegistrationNo={businessProfile.businessVatRegistrationNo}
            contactNumber={businessProfile.businessContact}
            email={businessProfile.businessEmail}
            address={businessProfile.businessAddress}
          />
        </div>
      }
    >
      {children}
    </PrintPageStack>
  );
}
