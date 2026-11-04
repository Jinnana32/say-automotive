import { afterEach, describe, expect, it, vi } from "vitest";

import {
  downloadPdfBlob,
  fetchPdfBlob,
  filenameFromContentDisposition,
  PdfRequestError,
} from "@/components/reports/print-pdf";

describe("print-pdf helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("parses content-disposition filenames", () => {
    expect(
      filenameFromContentDisposition(
        'attachment; filename="SAY-Quotation-QT-1.pdf"',
      ),
    ).toBe("SAY-Quotation-QT-1.pdf");
    expect(
      filenameFromContentDisposition(
        "attachment; filename*=UTF-8''SAY%20Quote.pdf",
      ),
    ).toBe("SAY Quote.pdf");
    expect(filenameFromContentDisposition(null)).toBe("document.pdf");
  });

  it("fetches a PDF blob with credentials", async () => {
    const blob = new Blob(["%PDF"], { type: "application/pdf" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => blob,
      }),
    );

    await expect(fetchPdfBlob("/api/quotations/1/pdf")).resolves.toBe(blob);
    expect(fetch).toHaveBeenCalledWith("/api/quotations/1/pdf", {
      method: "GET",
      credentials: "same-origin",
    });
  });

  it("throws PdfRequestError when the PDF API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Chrome missing",
      }),
    );

    await expect(fetchPdfBlob("/api/quotations/1/pdf")).rejects.toBeInstanceOf(
      PdfRequestError,
    );
    await expect(fetchPdfBlob("/api/quotations/1/pdf")).rejects.toThrow(
      "Chrome missing",
    );
  });

  it("downloads a blob via a temporary anchor", () => {
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:pdf"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(document, "createElement").mockReturnValue({
      click,
      remove,
      style: {},
      setAttribute: vi.fn(),
    } as unknown as HTMLElement);

    downloadPdfBlob(new Blob(["%PDF"]), "quote.pdf");

    expect(appendChild).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  });
});
