import { CircleDashed } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="surface-enter bg-card/45 grid min-h-80 place-items-center rounded-2xl border border-dashed p-8 text-center">
      <div className="max-w-md">
        <span className="bg-secondary text-primary mx-auto grid size-12 place-items-center rounded-2xl">
          <CircleDashed className="size-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </section>
  );
}
