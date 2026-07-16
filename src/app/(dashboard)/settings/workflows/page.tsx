import { ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WorkflowTemplateManager } from "@/components/workflows/workflow-template-manager";
import { getI18n } from "@/lib/i18n/server";
import { getCaseFormOptions } from "@/server/queries/cases";
import { getCurrentProfile } from "@/server/queries/profile";
import { listWorkflowTemplates } from "@/server/queries/workflows";

export default async function WorkflowSettingsPage() {
  const [{ locale, messages }, currentUser, templates, options] =
    await Promise.all([
      getI18n(),
      getCurrentProfile(),
      listWorkflowTemplates(),
      getCaseFormOptions(),
    ]);
  if (!currentUser?.roles.includes("super_admin")) {
    return (
      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>{messages.workflows.title}</AlertTitle>
        <AlertDescription>
          {messages.cases.errors.unauthorized}
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <>
      <PageHeader
        title={messages.workflows.title}
        description={messages.workflows.description}
      />
      {templates && options ? (
        <WorkflowTemplateManager
          templates={templates}
          procurementTypes={options.procurementTypes}
          locale={locale}
          messages={messages}
        />
      ) : (
        <Alert variant="destructive">
          <ShieldAlert />
          <AlertTitle>{messages.dashboard.dataUnavailableTitle}</AlertTitle>
          <AlertDescription>
            {messages.dashboard.dataUnavailableDescription}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
