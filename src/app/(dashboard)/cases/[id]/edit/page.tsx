import { ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { CaseForm } from "@/components/cases/case-form";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { caseDetailToFormValues } from "@/features/cases/form-values";
import { getI18n } from "@/lib/i18n/server";
import { canEditCase } from "@/lib/permissions/cases";
import { getCaseById } from "@/server/queries/cases";
import { getCurrentProfile } from "@/server/queries/profile";

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ locale, messages }, currentUser, detail] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
    getCaseById(id),
  ]);
  if (!currentUser || !detail) notFound();

  const editable = canEditCase({
    roles: currentUser.roles,
    status: detail.case.status,
    userId: currentUser.profile.id,
    ownerId: detail.case.case_owner_id,
    responsibleUserId: detail.case.current_responsible_user_id,
  });
  if (!editable) {
    return (
      <>
        <PageHeader
          title={messages.cases.editTitle}
          description={detail.case.case_number}
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

  const options = {
    ...detail.options,
    departments: detail.options.departments.filter(
      (item) =>
        item.is_active ||
        item.id === detail.case.requesting_department_id ||
        item.id === detail.case.current_responsible_department_id,
    ),
    fiscalYears: detail.options.fiscalYears.filter(
      (item) => item.is_active || item.id === detail.case.fiscal_year_id,
    ),
    budgetCategories: detail.options.budgetCategories.filter(
      (item) => item.is_active || item.id === detail.case.budget_category_id,
    ),
    budgetSources: detail.options.budgetSources.filter(
      (item) => item.is_active || item.id === detail.case.budget_source_id,
    ),
    procurementTypes: detail.options.procurementTypes.filter(
      (item) => item.is_active || item.id === detail.case.procurement_type_id,
    ),
  };

  return (
    <>
      <PageHeader
        title={messages.cases.editTitle}
        description={`${detail.case.case_number} · ${detail.case.title}`}
      />
      <CaseForm
        caseId={id}
        category={detail.categoryCode}
        initialValues={caseDetailToFormValues(detail)}
        locale={locale}
        messages={messages}
        options={options}
      />
    </>
  );
}
