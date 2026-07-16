import { NextResponse } from "next/server";

import { getPublicEnvironment } from "@/lib/env";
import { logServerError } from "@/lib/observability/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    getPublicEnvironment();
    return NextResponse.json(
      { status: "ok", configuration: "valid" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logServerError("health.configuration_invalid", error);
    return NextResponse.json(
      { status: "unavailable", configuration: "invalid" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
