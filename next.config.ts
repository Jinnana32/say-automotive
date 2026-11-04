import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const sparticuzChromiumBin = ["./node_modules/@sparticuz/chromium/bin/**"];

/** PDF API routes that launch Puppeteer — need Chromium brotli assets traced into the serverless bundle. */
const pdfRouteTracingIncludes = Object.fromEntries(
  [
    "/api/reports/pdf",
    "/api/quotations/[quotationId]/pdf",
    "/api/invoices/[invoiceId]/pdf",
    "/api/payments/[paymentId]/pdf",
    "/api/job-orders/[jobOrderId]/pdf",
    "/api/payroll/[periodId]/pdf",
    "/api/payroll/[periodId]/payslip/[itemId]/pdf",
  ].flatMap((route) => [
    [route, sparticuzChromiumBin],
    [`${route}/route`, sparticuzChromiumBin],
  ]),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: supabaseUrl
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: new URL(supabaseUrl).hostname,
          },
        ],
      }
    : undefined,
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: pdfRouteTracingIncludes,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
