import type { ReactNode } from "react";

import { PrintDocumentPage } from "@/components/reports/print-document-page";
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
  bodyClassName,
  compactHeader = false,
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
  bodyClassName?: string;
  compactHeader?: boolean;
}) {
  return (
    <PrintDocumentPage
      className={cn("leading-[1.4]", className)}
      bodyClassName={bodyClassName}
      horizontalPaddingClassName={horizontalPaddingClassName}
      topPaddingClassName={topPaddingClassName}
      bottomPaddingClassName={bottomPaddingClassName}
      compactHeader={compactHeader}
      businessProfile={{
        businessName,
        businessLogoUrl,
        businessVatRegistrationNo,
        businessContact,
        businessEmail,
        businessAddress,
      }}
      documentTitle={documentTitle}
      documentMeta={documentMeta}
    >
      {children}
    </PrintDocumentPage>
  );
}
