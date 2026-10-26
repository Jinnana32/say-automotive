"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { BlankPrintDocument } from "@/components/reports/blank-print-document";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { paginatePlainText } from "@/lib/reports/paginate-plain-text";
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
  className?: string;
}) {
  const measurePageRef = useRef<HTMLDivElement>(null);
  const measureTextRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[]>([bodyContent]);

  useLayoutEffect(() => {
    const pageRoot = measurePageRef.current;
    const textNode = measureTextRef.current;
    if (!pageRoot || !textNode) {
      return;
    }

    const bodySlot = pageRoot.querySelector<HTMLElement>("[data-blank-measure-body]");
    if (!bodySlot) {
      return;
    }

    const slotStyle = window.getComputedStyle(bodySlot);
    const paddingY =
      (Number.parseFloat(slotStyle.paddingTop) || 0) +
      (Number.parseFloat(slotStyle.paddingBottom) || 0);
    const maxHeight = Math.max(
      0,
      bodySlot.clientHeight - paddingY - HEIGHT_BUFFER_PX,
    );
    const measureHeight = (chunk: string) => {
      textNode.textContent = chunk;
      return textNode.scrollHeight;
    };

    setPages(paginatePlainText(bodyContent, measureHeight, maxHeight));
  }, [bodyContent, documentTitle, documentMeta]);

  return (
    <>
      <div
        ref={measurePageRef}
        aria-hidden
        className="pointer-events-none absolute -left-[99999px] top-0 w-[210mm] opacity-0"
      >
        {/* Match the printable page box (A4 minus @page margins) so splits fit print. */}
        <div className="[&_.print-page]:h-[calc(297mm-20mm)] [&_.print-page]:min-h-[calc(297mm-20mm)] [&_.print-page]:max-h-[calc(297mm-20mm)]">
          <BlankPrintDocument
            businessName={businessName}
            businessLogoUrl={businessLogoUrl}
            businessVatRegistrationNo={businessVatRegistrationNo}
            businessContact={businessContact}
            businessEmail={businessEmail}
            businessAddress={businessAddress}
            documentTitle={documentTitle}
            documentMeta={documentMeta}
            horizontalPaddingClassName="px-[10mm]"
            topPaddingClassName="pt-[8mm]"
            bottomPaddingClassName="pb-[8mm]"
            bodyClassName="pb-[4mm]"
          >
            <div data-blank-measure-body className="flex min-h-0 flex-1 flex-col pt-5">
              <div ref={measureTextRef} className={BODY_TEXT_CLASS} />
            </div>
          </BlankPrintDocument>
        </div>
      </div>

      <PrintPageStack className={cn("scroll-mt-28", className)}>
        {pages.map((pageContent, index) => (
          <BlankPrintDocument
            key={`blank-page-${index + 1}`}
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
      </PrintPageStack>
    </>
  );
}
