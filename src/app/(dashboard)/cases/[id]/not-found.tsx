import Link from "next/link";

import { EmptyState } from "@/components/layout/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function CaseNotFound() {
  const { messages } = await getI18n();
  return (
    <EmptyState
      title={messages.cases.detail.notFoundTitle}
      description={messages.cases.detail.notFoundDescription}
      action={
        <Link href="/cases" className={buttonVariants({ variant: "outline" })}>
          {messages.cases.actions.back}
        </Link>
      }
    />
  );
}
