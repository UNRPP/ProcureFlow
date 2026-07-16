import { NextResponse } from "next/server";

import {
  reportPeriod,
  validDateInput,
  validUuidInput,
} from "@/features/reports/filters";
import { buildPersonnelKpiWorkbook } from "@/lib/exports/reports";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/server/queries/profile";
import {
  getPersonnelKpiReport,
  getResponsibilityDetails,
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
  const start = validDateInput(url.searchParams.get("start") ?? undefined);
  const end = validDateInput(url.searchParams.get("end") ?? undefined);
  const period = reportPeriod(start, end);
  const userId = validUuidInput(url.searchParams.get("userId") ?? undefined);
  const stepKey = (url.searchParams.get("stage") ?? "")
    .replace(/[^a-z0-9_\-]/gi, "")
    .slice(0, 80);
  const filters = {
    start: period.start,
    end: period.end,
    userId,
    stepKey,
  };
  const [rows, details] = await Promise.all([
    getPersonnelKpiReport(filters),
    getResponsibilityDetails(filters),
  ]);
  if (!rows || !details) {
    return NextResponse.json(
      { error: messages.cases.errors.unavailable },
      { status: 503 },
    );
  }
  const buffer = await buildPersonnelKpiWorkbook({
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
      "Content-Disposition": `attachment; filename="${messages.reports.exports.filePersonnel}-${locale}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
