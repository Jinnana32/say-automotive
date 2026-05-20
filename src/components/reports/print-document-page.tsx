import type { ReactNode } from "react";

import { DocumentFooter } from "@/components/reports/document-footer";
import { DocumentHeader } from "@/components/reports/document-header";
import { PrintPage } from "@/components/reports/print-document-layout";

export type PrintDocumentBusinessProfile = {
  businessName: string;
  businessLogoUrl?: string | null;
  businessVatRegistrationNo: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
};

export function PrintDocumentPage({
  businessProfile,
  documentTitle,
  documentMeta,
  compactHeader = false,
  children,
  className,
  innerClassName,
  bodyClassName,
  horizontalPaddingClassName,
  topPaddingClassName,
  bottomPaddingClassName,
}: {
  businessProfile: PrintDocumentBusinessProfile;
  documentTitle: string;
  documentMeta?: string | null;
  compactHeader?: boolean;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  bodyClassName?: string;
  horizontalPaddingClassName?: string;
  topPaddingClassName?: string;
  bottomPaddingClassName?: string;
}) {
  return (
    <PrintPage
      className={className}
      innerClassName={innerClassName}
      bodyClassName={bodyClassName}
      horizontalPaddingClassName={horizontalPaddingClassName}
      topPaddingClassName={topPaddingClassName}
      bottomPaddingClassName={bottomPaddingClassName}
      header={
        <DocumentHeader
          businessName={businessProfile.businessName}
          documentTitle={documentTitle}
          documentMeta={documentMeta}
          logoSrc={businessProfile.businessLogoUrl}
          compact={compactHeader}
        />
      }
      footer={
        <DocumentFooter
          businessName={businessProfile.businessName}
          vatRegistrationNo={businessProfile.businessVatRegistrationNo}
          contactNumber={businessProfile.businessContact}
          email={businessProfile.businessEmail}
          address={businessProfile.businessAddress}
        />
      }
    >
      {children}
    </PrintPage>
  );
}
