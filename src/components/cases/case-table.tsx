"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import Link from "next/link";

import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/i18n/format";
import { localizedMasterDataName } from "@/lib/i18n/master-data";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import type { CaseListItem, CaseSortField } from "@/server/queries/cases";
import { cn } from "@/lib/utils";

type Props = {
  cases: CaseListItem[];
  locale: Locale;
  messages: Messages;
  query: Record<string, string>;
};

const columnHelper = createColumnHelper<CaseListItem>();

export function CaseTable({ cases, locale, messages, query }: Props) {
  const t = messages.cases;
  const name = (record: { name_en: string; name_th: string } | null) =>
    record
      ? localizedMasterDataName(record, locale)
      : messages.common.notProvided;
  const sortHeader = (label: string, field: CaseSortField) => {
    const active = query.sort === field;
    const nextDirection = active && query.direction === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(query);
    params.set("sort", field);
    params.set("direction", nextDirection);
    params.set("page", "1");
    const Icon = active
      ? query.direction === "asc"
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown;
    return (
      <Link
        href={`/cases?${params.toString()}`}
        className="hover:text-foreground inline-flex items-center gap-1"
        aria-label={`${label}: ${
          nextDirection === "asc"
            ? t.table.sortAscending
            : t.table.sortDescending
        }`}
      >
        {label}
        <Icon className="size-3.5" />
      </Link>
    );
  };

  const columns = [
    columnHelper.accessor("case_number", {
      header: () => sortHeader(t.fields.caseNumber, "case_number"),
      cell: (info) => (
        <Link
          href={`/cases/${info.row.original.id}`}
          className="text-primary font-mono text-xs font-semibold hover:underline"
        >
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor("title", {
      header: () => sortHeader(t.fields.title, "title"),
      cell: (info) => (
        <div className="max-w-72">
          <p className="truncate font-medium">{info.getValue()}</p>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {name(info.row.original.workCategory)}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("status", {
      header: () => sortHeader(t.fields.status, "status"),
      cell: (info) => (
        <CaseStatusBadge status={info.getValue()} messages={t.statuses} />
      ),
    }),
    columnHelper.display({
      id: "procurementType",
      header: t.fields.procurementType,
      cell: (info) => name(info.row.original.procurementType),
    }),
    columnHelper.display({
      id: "owner",
      header: t.fields.caseOwner,
      cell: (info) =>
        info.row.original.owner?.full_name ?? messages.common.notProvided,
    }),
    columnHelper.accessor("estimated_value", {
      header: () => sortHeader(t.fields.estimatedValue, "estimated_value"),
      cell: (info) => (
        <span className="tabular-nums">
          {formatCurrency(info.getValue(), locale)}
        </span>
      ),
    }),
    columnHelper.accessor("target_completion_date", {
      header: () =>
        sortHeader(t.fields.targetCompletionDate, "target_completion_date"),
      cell: (info) =>
        info.getValue()
          ? formatDate(info.getValue()!, locale)
          : t.table.noTarget,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <Link
          href={`/cases/${info.row.original.id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "ml-auto",
          )}
          aria-label={`${t.actions.view}: ${info.row.original.case_number}`}
        >
          <ExternalLink />
        </Link>
      ),
    }),
  ];

  // TanStack Table intentionally exposes a mutable table instance.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: cases,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="bg-card hidden overflow-x-auto rounded-2xl border md:block">
        <table className="w-full min-w-[64rem] text-left text-sm">
          <caption className="sr-only">
            {messages.pages.cases.description}
          </caption>
          <thead className="bg-muted/45 text-muted-foreground text-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="h-11 px-4 font-medium whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/25">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {cases.map((item) => (
          <Link
            key={item.id}
            href={`/cases/${item.id}`}
            className="bg-card hover:border-primary/35 block rounded-2xl border p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-primary font-mono text-xs font-semibold">
                  {item.case_number}
                </p>
                <h2 className="mt-1 line-clamp-2 font-semibold">
                  {item.title}
                </h2>
              </div>
              <CaseStatusBadge status={item.status} messages={t.statuses} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">
                  {t.fields.workCategory}
                </dt>
                <dd className="mt-0.5">{name(item.workCategory)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">
                  {t.fields.caseOwner}
                </dt>
                <dd className="mt-0.5">
                  {item.owner?.full_name ?? messages.common.notProvided}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">
                  {t.fields.estimatedValue}
                </dt>
                <dd className="mt-0.5 tabular-nums">
                  {formatCurrency(item.estimated_value, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">
                  {t.fields.targetCompletionDate}
                </dt>
                <dd className="mt-0.5">
                  {item.target_completion_date
                    ? formatDate(item.target_completion_date, locale)
                    : t.table.noTarget}
                </dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </>
  );
}
