import { Skeleton } from "@/components/ui/skeleton";
import { getI18n } from "@/lib/i18n/server";

export default async function DashboardLoading() {
  const { messages } = await getI18n();

  return (
    <div
      aria-busy="true"
      aria-label={messages.common.loading}
      className="space-y-6"
    >
      <div>
        <Skeleton className="h-9 w-52" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-56 rounded-3xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
