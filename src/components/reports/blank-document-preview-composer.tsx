"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

import { BlankPrintDocumentPages } from "@/components/reports/blank-print-document-pages";
import { PrintPaperSizeControls } from "@/components/reports/print-paper-size-controls";
import { PrintPaperSizeSync } from "@/components/reports/print-paper-size-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_PRINT_PAPER_SIZE,
  PRINT_PAPER_SIZE_STORAGE_KEY,
  type PrintPaperSize,
  resolvePrintPaperSize,
} from "@/lib/reports/print-paper-size";

const DEFAULT_DOCUMENT_TITLE = "BLANK DOCUMENT";
const DEFAULT_DOCUMENT_BODY = "This area is reserved for future document content.";

export function BlankDocumentPreviewComposer({
  businessName,
  businessLogoUrl,
  businessVatRegistrationNo,
  businessContact,
  businessEmail,
  businessAddress,
  branchName,
}: {
  businessName: string;
  businessLogoUrl: string | null;
  businessVatRegistrationNo: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  branchName: string;
}) {
  const [documentTitle, setDocumentTitle] = useState("");
  const [bodyContent, setBodyContent] = useState(DEFAULT_DOCUMENT_BODY);
  const [paperSize, setPaperSize] = useState<PrintPaperSize>(DEFAULT_PRINT_PAPER_SIZE);

  useEffect(() => {
    setPaperSize(
      resolvePrintPaperSize(window.localStorage.getItem(PRINT_PAPER_SIZE_STORAGE_KEY)),
    );
  }, []);

  const resolvedDocumentTitle = documentTitle.trim() || DEFAULT_DOCUMENT_TITLE;
  const resolvedBodyContent = bodyContent.trim() || DEFAULT_DOCUMENT_BODY;

  return (
    <div className="space-y-6">
      <PrintPaperSizeSync paperSize={paperSize} />
      <Card className="no-print mx-auto w-full max-w-[var(--print-page-width)]">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1">
            <CardTitle>Blank Document Composer</CardTitle>
            <CardDescription>
              Edit the title and body, then print the live preview using the current SAY Auto
              Care document header and footer for {branchName}.
            </CardDescription>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <PrintPaperSizeControls value={paperSize} onChange={setPaperSize} />
            <Button type="button" variant="bluePrimary" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="blank-document-title">Document Title</Label>
            <Input
              id="blank-document-title"
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              placeholder={DEFAULT_DOCUMENT_TITLE}
              className="h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="blank-document-body">Body Content</Label>
            <Textarea
              id="blank-document-body"
              value={bodyContent}
              onChange={(event) => setBodyContent(event.target.value)}
              placeholder={DEFAULT_DOCUMENT_BODY}
              className="min-h-[220px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      <div
        className="report-preview-shell relative px-4 py-8 sm:px-6 sm:py-10 print:px-0 print:py-0"
        data-print-paper={paperSize}
      >
        <BlankPrintDocumentPages
          businessName={businessName}
          businessLogoUrl={businessLogoUrl}
          businessVatRegistrationNo={businessVatRegistrationNo}
          businessContact={businessContact}
          businessEmail={businessEmail}
          businessAddress={businessAddress}
          documentTitle={resolvedDocumentTitle}
          documentMeta={branchName}
          bodyContent={resolvedBodyContent}
          paperSize={paperSize}
        />
      </div>
    </div>
  );
}
