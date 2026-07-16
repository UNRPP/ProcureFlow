"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  DashboardBreakdown,
  DashboardReport,
} from "@/server/queries/reporting";

const palette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type ChartLabels = {
  total: string;
  created: string;
  completed: string;
  activeCases: string;
};

function localizedRows(rows: DashboardBreakdown[], locale: "en" | "th") {
  return rows.map((row) => ({
    ...row,
    name: locale === "th" ? row.name_th : row.name_en,
  }));
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-card border-border rounded-2xl border p-5 shadow-sm ${className}`}
    >
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function DonutChart({
  rows,
  locale,
  totalLabel,
  ariaLabel,
}: {
  rows: DashboardBreakdown[];
  locale: "en" | "th";
  totalLabel: string;
  ariaLabel: string;
}) {
  const data = localizedRows(rows, locale);
  const total = data.reduce((sum, row) => sum + Number(row.total), 0);
  return (
    <div className="grid min-h-56 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,1fr)]">
      <div className="relative h-52" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={1.5}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((row, index) => (
                <Cell key={row.key} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                color: "var(--popover-foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-muted-foreground text-xs">{totalLabel}</span>
        </div>
      </div>
      <ul className="space-y-2.5">
        {data.map((row, index) => (
          <li key={row.key} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: palette[index % palette.length] }}
            />
            <span className="min-w-0 flex-1 truncate">{row.name}</span>
            <span className="font-medium tabular-nums">{row.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type DashboardChartsProps = {
  report: DashboardReport;
  locale: "en" | "th";
  titles: {
    byCategory: string;
    byProcurementType: string;
    byStage: string;
    byBudgetCategory: string;
    trend: string;
  };
  labels: ChartLabels;
};

export function DashboardCharts({
  report,
  locale,
  titles,
  labels,
}: DashboardChartsProps) {
  const procurementTypes = localizedRows(report.procurement_types, locale);
  const stages = localizedRows(report.stages, locale);
  const trend = report.trend.map((row) => ({
    ...row,
    label: new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(new Date(`${row.month}T00:00:00Z`)),
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <ChartCard title={titles.byCategory} className="xl:col-span-4">
        <DonutChart
          rows={report.categories}
          locale={locale}
          totalLabel={labels.total}
          ariaLabel={titles.byCategory}
        />
      </ChartCard>
      <ChartCard title={titles.byProcurementType} className="xl:col-span-4">
        <div className="h-64" role="img" aria-label={titles.byProcurementType}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={procurementTypes}
              layout="vertical"
              margin={{ left: 8 }}
            >
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar
                dataKey="total"
                fill="var(--chart-1)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">
          {procurementTypes.map((row) => (
            <li key={row.key}>
              {row.name}: {row.total}
            </li>
          ))}
        </ul>
      </ChartCard>
      <ChartCard title={titles.byStage} className="xl:col-span-4">
        <div className="h-64" role="img" aria-label={titles.byStage}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stages} margin={{ top: 12, right: 4, left: -28 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar
                dataKey="total"
                fill="var(--chart-1)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">
          {stages.map((row) => (
            <li key={row.key}>
              {row.name}: {row.total}
            </li>
          ))}
        </ul>
      </ChartCard>
      <ChartCard title={titles.trend} className="xl:col-span-8">
        <div className="h-72" role="img" aria-label={titles.trend}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 12, right: 12, left: -22 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                }}
              />
              <Line
                type="monotone"
                dataKey="created"
                name={labels.created}
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name={labels.completed}
                stroke="var(--chart-3)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">
          {trend.map((row) => (
            <li key={row.month}>
              {row.label}: {labels.created} {row.created}, {labels.completed}{" "}
              {row.completed}
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-center gap-6 text-xs">
          <span className="flex items-center gap-2">
            <span
              className="bg-chart-1 size-2 rounded-full"
              aria-hidden="true"
            />
            {labels.created}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="bg-chart-3 size-2 rounded-full"
              aria-hidden="true"
            />
            {labels.completed}
          </span>
        </div>
      </ChartCard>
      <ChartCard title={titles.byBudgetCategory} className="xl:col-span-4">
        <DonutChart
          rows={report.budget_categories}
          locale={locale}
          totalLabel={labels.total}
          ariaLabel={titles.byBudgetCategory}
        />
      </ChartCard>
    </div>
  );
}
