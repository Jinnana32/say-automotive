import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

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
}) {
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

    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
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
  const localExecutablePath = isServerlessPdfRuntime() ? null : await findLocalBrowserExecutablePath();

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

  return {
    args: puppeteer.defaultArgs({
      args: chromium.args,
      headless: "shell",
    }),
    defaultViewport: PDF_VIEWPORT,
    executablePath: await chromium.executablePath(),
    headless: "shell" as const,
  };
}

async function loadServerlessChromium() {
  const chromiumModule = await import("@sparticuz/chromium");
  const chromium = chromiumModule.default ?? chromiumModule;
  chromium.setGraphicsMode = false;
  return chromium;
}

async function findLocalBrowserExecutablePath() {
  for (const candidate of LOCAL_BROWSER_CANDIDATES) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}
