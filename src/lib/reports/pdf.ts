import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_PRINT_PAPER_SIZE,
  PDF_PRINTER_SAFE_MARGIN_MM,
  PRINT_PAPER_DIMENSIONS_MM,
  type PrintPaperSize,
} from "@/lib/reports/print-paper-size";

const LOCAL_BROWSER_CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter((value): value is string => Boolean(value));

const PDF_VIEWPORT = {
  width: 1280,
  height: 1810,
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
  isLandscape: false,
};

export async function renderInternalUrlToPdf(params: {
  url: string;
  cookieHeader?: string | null;
  paperSize?: PrintPaperSize;
}) {
  const paperSize = params.paperSize ?? DEFAULT_PRINT_PAPER_SIZE;
  const { default: puppeteer } = await import("puppeteer-core");
  const browser = await puppeteer.launch(await resolvePdfBrowserLaunchOptions(puppeteer));

  try {
    const page = await browser.newPage();

    if (params.cookieHeader) {
      await page.setExtraHTTPHeaders({
        cookie: params.cookieHeader,
      });
    }

    await page.goto(params.url, {
      waitUntil: "networkidle0",
    });
    await page.emulateMediaType("print");

    // Force paper + pdf render mode so each packed preview page maps to one sheet
    // (in-flow chrome, flex-pinned footer) instead of fixed runners spilling blanks.
    // Shrink the CSS page box to the printer-safe content area so Puppeteer margins
    // don't clip the footer that used to sit on the physical unprintable edge.
    const paper = PRINT_PAPER_DIMENSIONS_MM[paperSize];
    const contentWidthMm =
      paper.width - PDF_PRINTER_SAFE_MARGIN_MM.left - PDF_PRINTER_SAFE_MARGIN_MM.right;
    const contentHeightMm =
      paper.height - PDF_PRINTER_SAFE_MARGIN_MM.top - PDF_PRINTER_SAFE_MARGIN_MM.bottom;
    const cssPageSize = paperSize === "short-bond" ? "letter" : "A4";

    await page.evaluate(
      (payload) => {
        const root = document.documentElement;
        root.dataset.printPaper = payload.paperSize;
        root.dataset.printRender = "pdf";
        root.style.setProperty("--print-page-width", `${payload.contentWidthMm}mm`);
        root.style.setProperty("--print-page-height", `${payload.contentHeightMm}mm`);

        document.querySelectorAll(".print-running-chrome, .no-print").forEach((node) => {
          node.remove();
        });

        // Tighten header top padding — outer PDF margins already provide top inset.
        document
          .querySelectorAll(".print-document-header, .print-header")
          .forEach((node) => {
            if (node instanceof HTMLElement) {
              node.style.paddingTop = "4mm";
            }
          });

        const pages = document.querySelectorAll(
          ".print-page-stack > .print-page, .report-print-stack > .report-print-page",
        );
        const lastPage = pages[pages.length - 1];
        if (lastPage instanceof HTMLElement) {
          lastPage.style.breakAfter = "avoid";
          lastPage.style.pageBreakAfter = "avoid";
        }
      },
      {
        paperSize,
        contentWidthMm,
        contentHeightMm,
      },
    );
    await page.addStyleTag({
      content: `@page { size: ${cssPageSize} portrait; margin: 0; }`,
    });
    // Let layout settle after DOM/CSS swaps before snapshotting pages.
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));

    return await page.pdf({
      format: paperSize === "short-bond" ? "Letter" : "A4",
      printBackground: true,
      // Use explicit format; CSS @page named pages were contributing blank sheets.
      preferCSSPageSize: false,
      margin: {
        top: `${PDF_PRINTER_SAFE_MARGIN_MM.top}mm`,
        right: `${PDF_PRINTER_SAFE_MARGIN_MM.right}mm`,
        bottom: `${PDF_PRINTER_SAFE_MARGIN_MM.bottom}mm`,
        left: `${PDF_PRINTER_SAFE_MARGIN_MM.left}mm`,
      },
    });
  } finally {
    await browser.close();
  }
}

type PdfBrowserLauncher = {
  defaultArgs: (options?: { args?: string[]; headless?: boolean | "shell" }) => string[];
};

function isServerlessPdfRuntime() {
  return Boolean(process.env.AWS_REGION || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

async function resolvePdfBrowserLaunchOptions(puppeteer: PdfBrowserLauncher) {
  // Prefer a real local Chrome whenever it exists (dev Mac/Linux). Do not skip it
  // just because AWS_REGION/VERCEL is set in the environment for other SDKs.
  const localExecutablePath = await findLocalBrowserExecutablePath();

  if (localExecutablePath) {
    return {
      args: ["--disable-dev-shm-usage"],
      defaultViewport: PDF_VIEWPORT,
      executablePath: localExecutablePath,
      headless: true as const,
    };
  }

  if (!isServerlessPdfRuntime() && process.platform !== "linux") {
    throw new Error(
      "No local Chrome executable was found. Set PUPPETEER_EXECUTABLE_PATH or install Google Chrome to enable local PDF generation.",
    );
  }

  const chromium = await loadServerlessChromium();
  const executablePath = await resolveServerlessChromiumExecutablePath(chromium);

  return {
    args: puppeteer.defaultArgs({
      args: chromium.args,
      headless: "shell",
    }),
    defaultViewport: PDF_VIEWPORT,
    executablePath,
    headless: "shell" as const,
  };
}

type ServerlessChromium = {
  args: string[];
  executablePath: (input?: string) => Promise<string>;
  setGraphicsMode: boolean;
};

async function loadServerlessChromium(): Promise<ServerlessChromium> {
  const chromiumModule = await import("@sparticuz/chromium");
  const chromium = (chromiumModule.default ?? chromiumModule) as ServerlessChromium;
  chromium.setGraphicsMode = false;
  return chromium;
}

async function resolveServerlessChromiumExecutablePath(chromium: ServerlessChromium) {
  const binPath = join(process.cwd(), "node_modules", "@sparticuz", "chromium", "bin");

  try {
    await access(binPath, fsConstants.R_OK);
    return await chromium.executablePath(binPath);
  } catch {
    // Fall through to package-default resolution (works when file tracing kept bin/).
  }

  try {
    return await chromium.executablePath();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Serverless Chromium binaries are missing from the deploy bundle (${detail}). Ensure @sparticuz/chromium/bin is included via outputFileTracingIncludes.`,
    );
  }
}

async function findLocalBrowserExecutablePath() {
  for (const candidate of LOCAL_BROWSER_CANDIDATES) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  return null;
}
