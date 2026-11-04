export class PdfRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfRequestError";
  }
}

export async function fetchPdfBlob(href: string): Promise<Blob> {
  const response = await fetch(href, {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const detail = (await response.text()).trim();
    throw new PdfRequestError(
      detail || `Unable to generate PDF (${response.status}).`,
    );
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new PdfRequestError("The generated PDF was empty.");
  }

  return blob;
}

export function filenameFromContentDisposition(
  header: string | null,
  fallback = "document.pdf",
) {
  if (!header) {
    return fallback;
  }

  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim());
    } catch {
      return utfMatch[1].trim();
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(header);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return fallback;
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

/**
 * Open the PDF in a hidden iframe and trigger the browser print dialog for that file.
 * Uses the system PDF viewer path so Safari/Chrome HTML print CSS is not involved.
 */
export async function printPdfBlob(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Print PDF");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";

    let settled = false;
    const cleanup = () => {
      window.setTimeout(() => {
        iframe.remove();
        URL.revokeObjectURL(objectUrl);
      }, 60_000);
    };

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (error) {
        cleanup();
        reject(error);
        return;
      }
      cleanup();
      resolve();
    };

    iframe.onload = () => {
      window.setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          finish();
        } catch (error) {
          finish(
            error instanceof Error
              ? error
              : new PdfRequestError("Unable to open the print dialog for this PDF."),
          );
        }
      }, 250);
    };

    iframe.onerror = () => {
      finish(new PdfRequestError("Unable to load the generated PDF for printing."));
    };

    iframe.src = objectUrl;
    document.body.appendChild(iframe);
  });
}

export async function printPdfFromHref(href: string) {
  const blob = await fetchPdfBlob(href);
  await printPdfBlob(blob);
}

export async function downloadPdfFromHref(
  href: string,
  fallbackFilename = "document.pdf",
) {
  const response = await fetch(href, {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const detail = (await response.text()).trim();
    throw new PdfRequestError(
      detail || `Unable to generate PDF (${response.status}).`,
    );
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new PdfRequestError("The generated PDF was empty.");
  }

  const filename = filenameFromContentDisposition(
    response.headers.get("Content-Disposition"),
    fallbackFilename,
  );
  downloadPdfBlob(blob, filename);
}
