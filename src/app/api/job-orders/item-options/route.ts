import { NextResponse } from "next/server";

import { getAppSessionState } from "@/lib/auth/session";
import { getJobOrderItemCatalogOptions } from "@/features/job-orders/queries/job-order-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAppSessionState();

  if (session.status !== "authenticated") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!session.context.capabilities.includes("job_orders:write")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const options = await getJobOrderItemCatalogOptions();

  return NextResponse.json(options, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
