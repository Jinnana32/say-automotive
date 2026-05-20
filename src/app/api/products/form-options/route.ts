import { NextResponse } from "next/server";

import { getAppSessionState } from "@/lib/auth/session";
import { getProductFormOptions } from "@/features/products/queries/product-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAppSessionState();

  if (session.status !== "authenticated") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!session.context.capabilities.includes("products:write")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const options = await getProductFormOptions();

  return NextResponse.json(options, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
