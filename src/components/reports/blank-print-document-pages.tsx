"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { BlankPrintDocument } from "@/components/reports/blank-print-document";
import { PrintDocumentShell } from "@/components/reports/print-document-shell";
import { paginatePlainText } from "@/lib/reports/paginate-plain-text";
import {
  DEFAULT_PRINT_PAPER_SIZE,
  type PrintPaperSize,
} from "@/lib/reports/print-paper-size";
import { cn } from "@/lib/utils";

const BODY_TEXT_CLASS =
  "whitespace-pre-wrap break-words text-[12px] leading-[1.65] text-slate-800";
const HEIGHT_BUFFER_PX = 8;

export function BlankPrintDocumentPages({
  businessName,
  businessLogoUrl,
  businessVatRegistrationNo,
  businessContact,
  businessEmail,
  businessAddress,
  documentTitle,
  documentMeta,
  bodyContent,
  paperSize = DEFAULT_PRINT_PAPER_SIZE,
  className,
}: {
  businessName: string;
  businessLogoUrl?: string | null;
  businessVatRegistrationNo: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  documentTitle: string;
  documentMeta?: string | null;
  bodyContent: string;
  paperSize?: PrintPaperSize;
  className?: string;
}) {
  const measureSlotRef = useRef<HTMLDivElement>(null);
  const measureTextRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[]>([bodyContent]);

  const businessProfile = {
    businessName,
    businessLogoUrl,
    businessVatRegistrationNo,
    businessContact,
    businessEmail,
    businessAddress,
  };

  useLayoutEffect(() => {
    const bodySlot = measureSlotRef.current;
    const textNode = measureTextRef.current;
    if (!bodySlot || !textNode) {
      return;
    }

    const maxHeight = Math.max(0, bodySlot.clientHeight - HEIGHT_BUFFER_PX);
    const measureHeight = (chunk: string) => {
      textNode.textContent = chunk;
      return textNode.scrollHeight;
    };

    setPages(paginatePlainText(bodyContent, measureHeight, maxHeight));
  }, [bodyContent, documentTitle, documentMeta, paperSize]);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[99999px] top-0 w-[var(--print-page-width)] opacity-0"
        data-print-paper={paperSize}
      >
        {/* Printable body under @page margins + fixed runners. */}
        <div
          ref={measureSlotRef}
          className="h-[calc(var(--print-page-height)-var(--print-runner-header-space)-var(--print-runner-footer-space))] w-full px-[10mm] pt-5"
        >
          <div ref={measureTextRef} className={BODY_TEXT_CLASS} />
        </div>
      </div>

      <PrintDocumentShell
        className={cn("scroll-mt-28", className)}
        businessProfile={businessProfile}
        documentTitle={documentTitle}
        documentMeta={documentMeta}
      >
        {pages.map((pageContent, index) => (
          <BlankPrintDocument
            key={`blank-page-${index + 1}-${paperSize}`}
            businessName={businessName}
            businessLogoUrl={businessLogoUrl}
            businessVatRegistrationNo={businessVatRegistrationNo}
            businessContact={businessContact}
            businessEmail={businessEmail}
            businessAddress={businessAddress}
            documentTitle={documentTitle}
            documentMeta={
              index === 0
                ? documentMeta
                : [documentMeta, `Page ${index + 1}`].filter(Boolean).join(" · ")
            }
            horizontalPaddingClassName="px-[10mm]"
            topPaddingClassName="pt-[8mm]"
            bottomPaddingClassName="pb-[8mm]"
            bodyClassName="pb-[4mm]"
            compactHeader={index > 0}
          >
            <div
              className={cn(
                "pt-5",
                index === pages.length - 1 ? "min-h-[160mm] print:min-h-0" : "min-h-0",
              )}
            >
              <div className={BODY_TEXT_CLASS}>{pageContent}</div>
            </div>
          </BlankPrintDocument>
        ))}
      </PrintDocumentShell>
    </>
  );
}
