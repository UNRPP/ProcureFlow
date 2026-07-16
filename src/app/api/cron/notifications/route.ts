import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/env";
import { logServerError, logServerEvent } from "@/lib/observability/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let environment: ReturnType<typeof getServerEnvironment>;
  try {
    environment = getServerEnvironment();
  } catch {
    return NextResponse.json(
      { error: "server_configuration" },
      { status: 503 },
    );
  }
  if (
    request.headers.get("authorization") !== `Bearer ${environment.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "generate_procurement_notifications",
    {
      reference_time: new Date().toISOString(),
    },
  );
  if (error) {
    logServerError("notifications.generation_failed", error);
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
  logServerEvent("notifications.generated", { generated: data ?? 0 });
  return NextResponse.json({ generated: data ?? 0 });
}
