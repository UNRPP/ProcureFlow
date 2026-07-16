import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { WorkflowStepManager } from "@/components/workflows/workflow-step-manager";
import { getI18n } from "@/lib/i18n/server";
import { getCurrentProfile } from "@/server/queries/profile";
import { getWorkflowTemplate } from "@/server/queries/workflows";

export default async function WorkflowTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ locale, messages }, currentUser, detail] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
    getWorkflowTemplate(id),
  ]);
  if (!currentUser?.roles.includes("super_admin") || !detail) notFound();
  return (
    <>
      <Link
        href="/settings/workflows"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft />
        {messages.workflows.title}
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title={
            locale === "th" ? detail.template.name_th : detail.template.name_en
          }
          description={
            detail.template.code +
            " · " +
            messages.workflows.fields.version +
            " " +
            detail.template.version
          }
        />
        <Badge variant="outline">
          {messages.workflows.statuses[detail.template.status]}
        </Badge>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold">{messages.workflows.stepsTitle}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {messages.workflows.stepsDescription}
        </p>
      </div>
      <WorkflowStepManager
        detail={detail}
        locale={locale}
        messages={messages}
      />
    </>
  );
}
