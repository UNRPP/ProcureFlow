import { ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { CaseForm } from "@/components/cases/case-form";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createCaseDefaults } from "@/features/cases/form-values";
import { getI18n } from "@/lib/i18n/server";
import { canCreateCase } from "@/lib/permissions/cases";
import { getCaseFormOptions } from "@/server/queries/cases";
import { getCurrentProfile } from "@/server/queries/profile";
import type { WorkCategoryCode } from "@/types/database";

const categories: WorkCategoryCode[] = [
  "medical_device",
  "medical_equipment",
  "service_contract",
];

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: requestedCategory } = await searchParams;
  if (!categories.includes(requestedCategory as WorkCategoryCode)) notFound();
  const category = requestedCategory as WorkCategoryCode;
  const [{ locale, messages }, currentUser, options] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
    getCaseFormOptions(),
  ]);
  if (!currentUser || !options) {
    return (
      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>{messages.cases.errors.saveTitle}</AlertTitle>
        <AlertDescription>{messages.cases.errors.unavailable}</AlertDescription>
      </Alert>
    );
  }

  if (!canCreateCase(currentUser.roles)) {
    return (
      <>
        <PageHeader
          title={messages.cases.newTitle}
          description={messages.cases.newDescription}
        />
        <Alert variant="destructive">
          <ShieldAlert />
          <AlertTitle>{messages.cases.detail.readOnly}</AlertTitle>
          <AlertDescription>
            {messages.cases.errors.unauthorized}
          </AlertDescription>
        </Alert>
      </>
    );
  }

  const defaults = createCaseDefaults({
    category,
    ownerId: currentUser.profile.id,
    requestingDepartmentId: currentUser.profile.department_id ?? undefined,
    fiscalYearId: options.fiscalYears[0]?.id,
    budgetCategoryId: options.budgetCategories[0]?.id,
    budgetSourceId: options.budgetSources[0]?.id,
    procurementTypeId: options.procurementTypes[0]?.id,
  });

  return (
    <>
      <PageHeader
        title={messages.cases.newTitle}
        description={messages.cases.newDescription}
      />
      <CaseForm
        category={category}
        initialValues={defaults}
        locale={locale}
        messages={messages}
        options={options}
      />
    </>
  );
}
