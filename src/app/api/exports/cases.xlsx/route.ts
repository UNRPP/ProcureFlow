import { NextResponse } from "next/server";

import { caseFiltersFromSearchParams } from "@/features/cases/filters";
import { buildCaseStatusWorkbook } from "@/lib/exports/case-status";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import { listCasesForExport } from "@/server/queries/cases";
import { getCurrentProfile } from "@/server/queries/profile";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLocale = url.searchParams.get("locale");
  const locale = isLocale(requestedLocale)
    ? requestedLocale
    : await getLocale();
  const messages = getMessages(locale);
  const currentUser = await getCurrentProfile();
  if (!currentUser) {
    return NextResponse.json(
      { error: messages.cases.errors.unauthorized },
      { status: 401 },
    );
  }
  const rows = await listCasesForExport(
    caseFiltersFromSearchParams(url.searchParams),
  );
  if (!rows) {
    return NextResponse.json(
      { error: messages.cases.errors.unavailable },
      { status: 503 },
    );
  }
  const buffer = await buildCaseStatusWorkbook({
    rows,
    locale,
    messages,
    exportedAt: new Date(),
    filterDescription: url.searchParams.toString(),
  });
  const body = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${messages.cases.exports.fileName}-${locale}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
