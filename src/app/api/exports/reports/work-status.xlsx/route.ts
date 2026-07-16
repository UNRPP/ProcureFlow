import { NextResponse } from "next/server";

import {
  isReportGrouping,
  reportPeriod,
  validDateInput,
} from "@/features/reports/filters";
import { buildWorkStatusWorkbook } from "@/lib/exports/reports";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/server/queries/profile";
import {
  getWorkStatusCaseDetails,
  getWorkStatusReport,
} from "@/server/queries/reporting";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const localeParam = url.searchParams.get("locale");
  const locale = isLocale(localeParam) ? localeParam : await getLocale();
  const messages = getMessages(locale);
  const currentUser = await getCurrentProfile();
  if (!currentUser) {
    return NextResponse.json(
      { error: messages.cases.errors.unauthorized },
      { status: 401 },
    );
  }
  const requestedGroup = url.searchParams.get("group") ?? "";
  const grouping = isReportGrouping(requestedGroup)
    ? requestedGroup
    : "work_category";
  const start = validDateInput(url.searchParams.get("start") ?? undefined);
  const end = validDateInput(url.searchParams.get("end") ?? undefined);
  const period = reportPeriod(start, end);
  const [rows, details] = await Promise.all([
    getWorkStatusReport(grouping, period),
    getWorkStatusCaseDetails(period),
  ]);
  if (!rows || !details) {
    return NextResponse.json(
      { error: messages.cases.errors.unavailable },
      { status: 503 },
    );
  }
  const buffer = await buildWorkStatusWorkbook({
    grouping,
    rows,
    details,
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
      "Content-Disposition": `attachment; filename="${messages.reports.exports.fileWorkStatus}-${locale}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
