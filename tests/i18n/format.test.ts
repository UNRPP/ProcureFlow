import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate, formatNumber } from "@/lib/i18n/format";

describe("locale-aware formatting", () => {
  it("uses the Gregorian year for English and Buddhist year for Thai", () => {
    const date = new Date("2026-07-14T12:00:00+07:00");

    expect(
      formatDate(date, "en", { year: "numeric", timeZone: "Asia/Bangkok" }),
    ).toContain("2026");
    expect(
      formatDate(date, "th", { year: "numeric", timeZone: "Asia/Bangkok" }),
    ).toContain("2569");
  });

  it("formats numeric and currency values through Intl", () => {
    expect(formatNumber(1234.5, "en")).toContain("1,234.5");
    expect(formatCurrency(2500, "th")).toMatch(/฿|THB/);
  });
});
