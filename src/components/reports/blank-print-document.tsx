import type { ReactNode } from "react";

import { DocumentFooter } from "@/components/reports/document-footer";
import { DocumentHeader } from "@/components/reports/document-header";
import { PrintDocumentLayout } from "@/components/reports/print-document-layout";
import { cn } from "@/lib/utils";

export function BlankPrintDocument({
  businessName,
  businessLogoUrl,
  businessVatRegistrationNo,
  businessContact,
  businessEmail,
  businessAddress,
  documentTitle,
  documentMeta,
  children,
  className,
  horizontalPaddingClassName,
  topPaddingClassName,
  bottomPaddingClassName,
}: {
  businessName: string;
  businessLogoUrl?: string | null;
  businessVatRegistrationNo: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  documentTitle: string;
  documentMeta?: string | null;
  children: ReactNode;
  className?: string;
  horizontalPaddingClassName?: string;
  topPaddingClassName?: string;
  bottomPaddingClassName?: string;
}) {
  return (
    <PrintDocumentLayout
      className={cn("leading-[1.4]", className)}
      horizontalPaddingClassName={horizontalPaddingClassName}
      topPaddingClassName={topPaddingClassName}
      bottomPaddingClassName={bottomPaddingClassName}
      header={
        <DocumentHeader
          businessName={businessName}
          documentTitle={documentTitle}
          documentMeta={documentMeta}
          logoSrc={businessLogoUrl}
        />
      }
      footer={
        <DocumentFooter
          businessName={businessName}
          vatRegistrationNo={businessVatRegistrationNo}
          contactNumber={businessContact}
          email={businessEmail}
          address={businessAddress}
        />
      }
    >
      {children}
    </PrintDocumentLayout>
  );
}
