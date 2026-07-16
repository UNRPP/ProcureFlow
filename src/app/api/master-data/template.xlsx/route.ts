import { NextResponse } from "next/server";

import { isEditableMasterDataTable } from "@/features/settings/master-data";
import { buildMasterDataTemplate } from "@/lib/exports/master-data-template";
import { isLocale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/server/queries/profile";

export async function GET(request: Request) {
  const currentUser = await getCurrentProfile();
  if (!currentUser?.roles.includes("super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const table = url.searchParams.get("table") ?? "";
  if (!isEditableMasterDataTable(table)) {
    return NextResponse.json({ error: "Unsupported template" }, { status: 400 });
  }
  const requestedLocale = url.searchParams.get("locale");
  const locale = isLocale(requestedLocale) ? requestedLocale : await getLocale();
  const buffer = await buildMasterDataTemplate(table, locale);
  const body = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="procureflow-${table}-template.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
