"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { FileUp } from "lucide-react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { importProductsFromCsvAction } from "@/features/products/actions/product-csv-import-action";
import { INITIAL_PRODUCT_CSV_IMPORT_STATE } from "@/features/products/product-csv-import-state";
import { PRODUCT_CSV_TEMPLATE } from "@/features/products/schemas/product-csv-import";
import { cn } from "@/lib/utils";

export function ProductCsvImportDialog() {
  const [dialogInstance, setDialogInstance] = useState(0);

  return (
    <ModalDialog
      title="Import products from CSV"
      description="Create-only import. Rows with an existing SKU or barcode in this branch are skipped. Units, categories, brands, and suppliers must already exist by name."
      size="lg"
      trigger={({ openDialog }) => (
        <Button
          type="button"
          variant="outlineBlue"
          onClick={() => {
            setDialogInstance((current) => current + 1);
            openDialog();
          }}
        >
          <FileUp className="mr-2 size-4" />
          Import CSV
        </Button>
      )}
    >
      {({ closeDialog }) => (
        <ProductCsvImportForm key={dialogInstance} closeDialog={closeDialog} />
      )}
    </ModalDialog>
  );
}

function ProductCsvImportForm({ closeDialog }: { closeDialog: () => void }) {
  const [state, formAction] = useActionState(
    importProductsFromCsvAction,
    INITIAL_PRODUCT_CSV_IMPORT_STATE,
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastHandledMessage = useRef<string | null>(null);

  const isFinished =
    state?.status === "success" ||
    (state?.status === "error" && (state.results?.length ?? 0) > 0);
  const hasFileSelected = Boolean(fileName);

  // After a server submit, the browser clears <input type="file">. Sync our label.
  useEffect(() => {
    if (!state?.message || state.message === lastHandledMessage.current) {
      return;
    }

    lastHandledMessage.current = state.message;
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [state?.message]);

  const summaryTone = useMemo(() => {
    if (!state?.status || state.status === "idle") {
      return null;
    }
    if ((state.failedCount ?? 0) > 0 && (state.createdCount ?? 0) === 0) {
      return "error";
    }
    return "success";
  }, [state]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p>
          Required: product name + unit + selling price.{" "}
          <code className="text-xs">product_type</code> is optional (inferred from category when
          missing).
        </p>
        <p className="mt-1">
          Supports the system template and SAY inventory Products exports (
          <code className="text-xs">Product Name</code>, <code className="text-xs">Unit</code>,{" "}
          <code className="text-xs">Selling Price</code>, etc.).
        </p>
        <p className="mt-1">
          Upload a <strong className="font-medium text-foreground">.csv</strong> file. If you open it
          in Excel, use <em>Save As → CSV</em>—not an <code className="text-xs">.xlsx</code> workbook.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
          Download template
        </Button>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="productCsvFile"
            className="text-sm font-medium text-foreground"
          >
            CSV file
          </label>
          <input
            ref={fileInputRef}
            id="productCsvFile"
            name="csvFile"
            type="file"
            accept=".csv,text/csv"
            required={!isFinished || hasFileSelected}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
            onChange={(event) => {
              setFileName(event.target.files?.[0]?.name ?? null);
            }}
          />
          {fileName ? (
            <p className="text-xs text-muted-foreground">Selected: {fileName}</p>
          ) : isFinished ? (
            <p className="text-xs text-muted-foreground">
              Import finished. Choose another CSV only if you want to import more products.
            </p>
          ) : null}
        </div>

        {state?.message ? (
          <div
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              summaryTone === "error"
                ? "border-destructive/20 bg-destructive/5 text-destructive"
                : "border-emerald-200 bg-emerald-50 text-emerald-800",
            )}
          >
            {state.message}
          </div>
        ) : null}

        {(state?.results?.length ?? 0) > 0 ? (
          <div className="max-h-64 overflow-auto rounded-xl border border-border/70">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="px-3 py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {state.results.map((result) => (
                  <tr key={`${result.rowNumber}-${result.name}`} className="border-t border-border/60">
                    <td className="px-3 py-2 tabular-nums">{result.rowNumber}</td>
                    <td className="px-3 py-2 font-medium">{result.name}</td>
                    <td className="px-3 py-2 capitalize">{result.status}</td>
                    <td className="px-3 py-2 text-muted-foreground">{result.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          {isFinished && !hasFileSelected ? (
            <Button type="button" variant="bluePrimary" onClick={closeDialog}>
              Done
            </Button>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog}>
                {isFinished ? "Close" : "Cancel"}
              </Button>
              <SubmitButton pendingLabel="Importing..." disabled={!hasFileSelected}>
                {isFinished ? "Import another file" : "Import products"}
              </SubmitButton>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

function downloadTemplate() {
  const blob = new Blob([PRODUCT_CSV_TEMPLATE], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "product-import-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
