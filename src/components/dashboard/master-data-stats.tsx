import {
  Building2,
  CalendarRange,
  HeartPulse,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function MasterDataStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="bg-border grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="surface-enter bg-card p-5"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {stat.value}
                </p>
              </div>
              <span className="bg-secondary text-primary grid size-10 place-items-center rounded-xl">
                <Icon className="size-5" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const masterDataStatIcons = {
  categories: HeartPulse,
  departments: Building2,
  procurementTypes: ListChecks,
  fiscalYears: CalendarRange,
} as const;
