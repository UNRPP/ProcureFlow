import { NextResponse } from "next/server";

import { caseFiltersFromSearchParams } from "@/features/cases/filters";
import { buildCasesCsv } from "@/lib/exports/case-status";
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
  const csv = buildCasesCsv({
    rows,
    locale,
    messages,
    exportedAt: new Date(),
    filterDescription: url.searchParams.toString(),
  });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${messages.cases.exports.fileName}-${locale}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
