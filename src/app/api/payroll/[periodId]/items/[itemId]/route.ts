import { NextResponse } from "next/server";

import { getPayrollPeriodItemBreakdownData } from "@/features/payroll/queries/payroll-queries";
import { getAppSessionState } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type PayrollItemBreakdownRouteContext = {
  params: Promise<{
    periodId: string;
    itemId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: PayrollItemBreakdownRouteContext,
) {
  const session = await getAppSessionState();

  if (session.status !== "authenticated") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!session.context.capabilities.includes("payroll:read")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { periodId, itemId } = await context.params;
  const data = await getPayrollPeriodItemBreakdownData(periodId, itemId);

  if (!data) {
    return NextResponse.json({ message: "Payroll breakdown not found." }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
