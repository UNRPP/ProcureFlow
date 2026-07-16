import Link from "next/link";

import { EmptyState } from "@/components/layout/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { messages } = await getI18n();

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <EmptyState
        title={messages.common.notFoundTitle}
        description={messages.common.notFoundDescription}
        action={
          <Link href="/dashboard" className={buttonVariants()}>
            {messages.common.backToDashboard}
          </Link>
        }
      />
    </main>
  );
}
