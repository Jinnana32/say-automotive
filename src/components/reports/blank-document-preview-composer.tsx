"use client";

import { useState } from "react";
import { Printer } from "lucide-react";

import { BlankPrintDocument } from "@/components/reports/blank-print-document";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  const resolvedDocumentTitle = documentTitle.trim() || DEFAULT_DOCUMENT_TITLE;
  const resolvedBodyContent = bodyContent.trim() || DEFAULT_DOCUMENT_BODY;

  return (
    <div className="space-y-6">
      <Card className="no-print mx-auto w-full max-w-[210mm]">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1">
            <CardTitle>Blank Document Composer</CardTitle>
            <CardDescription>
              Edit the title and body, then print the live A4 preview using the current SAY Auto
              Care document header and footer for {branchName}.
            </CardDescription>
          </div>
          <Button type="button" variant="bluePrimary" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
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

      <div className="report-preview-shell px-4 py-5 sm:px-6">
        <PrintPageStack>
          <BlankPrintDocument
            businessName={businessName}
            businessLogoUrl={businessLogoUrl}
            businessVatRegistrationNo={businessVatRegistrationNo}
            businessContact={businessContact}
            businessEmail={businessEmail}
            businessAddress={businessAddress}
            documentTitle={resolvedDocumentTitle}
            documentMeta={`Internal blank document preview • ${branchName}`}
            bodyClassName="pb-[12mm]"
          >
            <div className="min-h-[180mm] pt-6">
              <div className="whitespace-pre-wrap text-[12px] leading-[1.68] text-slate-800">
                {resolvedBodyContent}
              </div>
            </div>
          </BlankPrintDocument>
        </PrintPageStack>
      </div>
    </div>
  );
}
