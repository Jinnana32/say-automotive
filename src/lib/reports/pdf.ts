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

export async function renderInternalUrlToPdf(params: {
  url: string;
  cookieHeader?: string | null;
}) {
  const [{ default: puppeteer }, chromiumModule] = await Promise.all([
    import("puppeteer-core"),
    import("@sparticuz/chromium"),
  ]);
  const chromium = chromiumModule.default ?? chromiumModule;
  const executablePath = await resolveBrowserExecutablePath(chromium);

  chromium.setGraphicsMode = false;

  const browser = await puppeteer.launch({
    args: puppeteer.defaultArgs({
      args: chromium.args,
      headless: "shell",
    }),
    defaultViewport: {
      width: 1280,
      height: 1810,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false,
    },
    executablePath,
    headless: "shell",
  });

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

async function resolveBrowserExecutablePath(chromium: {
  executablePath: () => Promise<string>;
}) {
  if (process.env.AWS_REGION || process.env.VERCEL) {
    return chromium.executablePath();
  }

  for (const candidate of LOCAL_BROWSER_CANDIDATES) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }

  if (process.platform !== "linux") {
    throw new Error(
      "No local Chrome executable was found. Set PUPPETEER_EXECUTABLE_PATH or install Google Chrome to enable local PDF generation.",
    );
  }

  return chromium.executablePath();
}
