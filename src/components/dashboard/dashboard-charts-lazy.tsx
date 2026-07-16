"use client";

import dynamic from "next/dynamic";

import type { DashboardChartsProps } from "./dashboard-charts";

const LazyDashboardCharts = dynamic(
  () => import("./dashboard-charts").then((module) => module.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card h-80 animate-pulse rounded-2xl border" />
    ),
  },
);

export function DashboardChartsLazy({
  loadingLabel,
  ...props
}: DashboardChartsProps & { loadingLabel: string }) {
  return (
    <div aria-label={loadingLabel} aria-live="polite">
      <LazyDashboardCharts {...props} />
    </div>
  );
}
