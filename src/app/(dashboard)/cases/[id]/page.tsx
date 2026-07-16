import { CheckCircle2, Clock3, FileStack, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { CaseComments } from "@/components/comments/case-comments";
import { DocumentPanel } from "@/components/documents/document-panel";
import { CaseWorkflowPanel } from "@/components/workflows/case-workflow-panel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/i18n/format";
import { localizedMasterDataName } from "@/lib/i18n/master-data";
import { getI18n } from "@/lib/i18n/server";
import { canEditCase } from "@/lib/permissions/cases";
import { getCaseById } from "@/server/queries/cases";
import { getCaseCollaboration } from "@/server/queries/collaboration";
import { getCurrentProfile } from "@/server/queries/profile";
import { getCaseWorkflow } from "@/server/queries/workflows";
import { cn } from "@/lib/utils";

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [{ locale, messages }, detail, currentUser] = await Promise.all([
    getI18n(),
    getCaseById(id),
    getCurrentProfile(),
  ]);
  if (!detail || !currentUser) notFound();
  const workflow = await getCaseWorkflow(id, detail.case.procurement_type_id);
  const collaboration = await getCaseCollaboration(
    id,
    workflow?.currentStage?.id ?? detail.case.current_stage_instance_id,
  );
  const t = messages.cases;
  const procurementCase = detail.case;
  const find = (
    records: { id: string; name_en: string; name_th: string }[],
    value: string,
  ) => {
    const record = records.find((item) => item.id === value);
    return record
      ? localizedMasterDataName(record, locale)
      : messages.common.notProvided;
  };
  const editable = canEditCase({
    roles: currentUser.roles,
    status: procurementCase.status,
    userId: currentUser.profile.id,
    ownerId: procurementCase.case_owner_id,
    responsibleUserId: procurementCase.current_responsible_user_id,
  });
  const owner =
    detail.options.profiles.find(
      (profile) => profile.id === procurementCase.case_owner_id,
    )?.full_name ?? messages.common.notProvided;
  const responsible = procurementCase.current_responsible_user_id
    ? (detail.options.profiles.find(
        (profile) => profile.id === procurementCase.current_responsible_user_id,
      )?.full_name ?? messages.common.notProvided)
    : procurementCase.current_responsible_department_id
      ? find(
          detail.options.departments,
          procurementCase.current_responsible_department_id,
        )
      : t.table.unassigned;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/cases"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← {t.actions.back}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-primary font-mono text-sm font-semibold">
              {procurementCase.case_number}
            </span>
            <CaseStatusBadge
              status={procurementCase.status}
              messages={t.statuses}
            />
            <Badge variant="outline">
              {t.priorities[procurementCase.priority]}
            </Badge>
          </div>
          <h1 className="mt-2 max-w-4xl text-2xl font-semibold tracking-tight sm:text-3xl">
            {procurementCase.title}
          </h1>
          {procurementCase.description ? (
            <p className="text-muted-foreground mt-2 max-w-4xl text-sm leading-6">
              {procurementCase.description}
            </p>
          ) : null}
        </div>
        {editable ? (
          <Link
            href={`/cases/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
          >
            <Pencil />
            {t.actions.edit}
          </Link>
        ) : null}
      </div>

      {query.saved === "1" ? (
        <Alert className="border-success/35 bg-success/8 mb-5">
          <CheckCircle2 className="text-success-foreground" />
          <AlertDescription>{t.detail.saved}</AlertDescription>
        </Alert>
      ) : null}

      {!editable ? (
        <Alert className="mb-5">
          <Clock3 />
          <AlertDescription>{t.detail.readOnly}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-5">
          <DetailSection title={t.sections.summary}>
            <DetailGrid>
              <DetailItem
                label={t.fields.workCategory}
                value={t.categories[detail.categoryCode]}
              />
              <DetailItem
                label={t.fields.requestingDepartment}
                value={find(
                  detail.options.departments,
                  procurementCase.requesting_department_id,
                )}
              />
              <DetailItem
                label={t.fields.procurementType}
                value={find(
                  detail.options.procurementTypes,
                  procurementCase.procurement_type_id,
                )}
              />
              <DetailItem
                label={t.fields.targetCompletionDate}
                value={
                  procurementCase.target_completion_date
                    ? formatDate(procurementCase.target_completion_date, locale)
                    : messages.common.notProvided
                }
              />
              <DetailItem
                label={t.fields.createdAt}
                value={formatDate(procurementCase.created_at, locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
              <DetailItem
                label={t.fields.updatedAt}
                value={formatDate(procurementCase.updated_at, locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            </DetailGrid>
          </DetailSection>

          <DetailSection title={t.sections.budget}>
            <DetailGrid>
              <DetailItem
                label={t.fields.fiscalYear}
                value={find(
                  detail.options.fiscalYears,
                  procurementCase.fiscal_year_id,
                )}
              />
              <DetailItem
                label={t.fields.budgetCategory}
                value={find(
                  detail.options.budgetCategories,
                  procurementCase.budget_category_id,
                )}
              />
              <DetailItem
                label={t.fields.budgetSource}
                value={find(
                  detail.options.budgetSources,
                  procurementCase.budget_source_id,
                )}
              />
              <DetailItem
                label={t.fields.estimatedValue}
                value={formatCurrency(procurementCase.estimated_value, locale)}
              />
              <DetailItem
                label={t.fields.finalValue}
                value={
                  procurementCase.final_value === null
                    ? messages.common.notProvided
                    : formatCurrency(procurementCase.final_value, locale)
                }
              />
            </DetailGrid>
          </DetailSection>

          <DetailSection title={t.categories[detail.categoryCode]}>
            <CategoryDetails
              detail={detail}
              locale={locale}
              messages={messages}
            />
          </DetailSection>
          {workflow ? (
            <CaseWorkflowPanel
              caseId={id}
              caseStatus={procurementCase.status}
              workflow={workflow}
              editable={editable}
              locale={locale}
              messages={messages}
            />
          ) : null}
        </div>

        <div className="space-y-5">
          <DetailSection title={t.sections.responsibility}>
            <DetailGrid single>
              <DetailItem label={t.fields.caseOwner} value={owner} />
              <DetailItem
                label={t.fields.responsibleParty}
                value={responsible}
              />
            </DetailGrid>
          </DetailSection>
          {collaboration ? (
            <>
              <DocumentPanel
                caseId={id}
                currentStageId={
                  workflow?.currentStage?.id ??
                  procurementCase.current_stage_instance_id
                }
                data={collaboration}
                editable={editable}
                locale={locale}
                messages={messages}
              />
              <CaseComments
                caseId={id}
                comments={collaboration.comments}
                canComment={currentUser.roles.some((role) =>
                  [
                    "super_admin",
                    "procurement_manager",
                    "procurement_officer",
                  ].includes(role),
                )}
                locale={locale}
                messages={messages}
              />
            </>
          ) : (
            <PlaceholderSection
              icon={FileStack}
              title={t.sections.documents}
              description={messages.dashboard.dataUnavailableDescription}
            />
          )}
        </div>
      </div>
    </>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-2xl border">
      <h2 className="border-b px-4 py-3.5 font-semibold sm:px-5">{title}</h2>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function DetailGrid({
  children,
  single = false,
}: {
  children: React.ReactNode;
  single?: boolean;
}) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4", !single && "sm:grid-cols-2")}>
      {children}
    </dl>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

function PlaceholderSection({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileStack;
  title: string;
  description: string;
}) {
  return (
    <section className="bg-card rounded-2xl border p-5">
      <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-xl">
        <Icon className="size-4" />
      </div>
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm leading-5">
        {description}
      </p>
    </section>
  );
}

function CategoryDetails({
  detail,
  locale,
  messages,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getCaseById>>>;
  locale: "en" | "th";
  messages: Awaited<ReturnType<typeof getI18n>>["messages"];
}) {
  const t = messages.cases;
  if (detail.categoryCode === "medical_device") {
    return (
      <DetailGrid>
        <DetailItem label={t.fields.itemName} value={detail.detail.item_name} />
        <DetailItem
          label={t.fields.quantity}
          value={String(detail.detail.quantity)}
        />
        <DetailItem label={t.fields.unit} value={detail.detail.unit} />
        <DetailItem
          label={t.fields.estimatedUnitPrice}
          value={formatCurrency(detail.detail.estimated_unit_price, locale)}
        />
        <DetailItem
          label={t.fields.deviceClassification}
          value={detail.detail.device_classification}
        />
        <DetailItem
          label={t.fields.reusable}
          value={
            detail.detail.is_reusable
              ? t.boolean.reusable
              : t.boolean.consumable
          }
        />
        <div className="sm:col-span-2">
          <DetailItem
            label={t.fields.intendedUse}
            value={detail.detail.intended_use}
          />
        </div>
      </DetailGrid>
    );
  }
  if (detail.categoryCode === "medical_equipment") {
    return (
      <DetailGrid>
        <DetailItem
          label={t.fields.equipmentName}
          value={detail.detail.equipment_name}
        />
        <DetailItem
          label={t.fields.quantity}
          value={String(detail.detail.quantity)}
        />
        <DetailItem
          label={t.fields.purchaseKind}
          value={t.purchaseKinds[detail.detail.purchase_kind]}
        />
        <DetailItem
          label={t.fields.installationLocation}
          value={detail.detail.installation_location}
        />
        <DetailItem
          label={t.fields.replacedAssetReference}
          value={
            detail.detail.replaced_asset_reference ??
            messages.common.notProvided
          }
        />
        <DetailItem
          label={t.fields.expectedInstallationDate}
          value={
            detail.detail.expected_installation_date
              ? formatDate(detail.detail.expected_installation_date, locale)
              : messages.common.notProvided
          }
        />
        <DetailItem
          label={t.fields.warrantyRequired}
          value={
            detail.detail.warranty_required
              ? messages.common.yes
              : messages.common.no
          }
        />
        <DetailItem
          label={t.fields.maintenanceRequired}
          value={
            detail.detail.maintenance_required
              ? messages.common.yes
              : messages.common.no
          }
        />
      </DetailGrid>
    );
  }
  return (
    <DetailGrid>
      <div className="sm:col-span-2">
        <DetailItem
          label={t.fields.scopeOfService}
          value={detail.detail.scope_of_service}
        />
      </div>
      <DetailItem
        label={t.fields.contractStartDate}
        value={formatDate(detail.detail.contract_start_date, locale)}
      />
      <DetailItem
        label={t.fields.contractEndDate}
        value={formatDate(detail.detail.contract_end_date, locale)}
      />
      <DetailItem
        label={t.fields.recurring}
        value={
          detail.detail.is_recurring ? t.boolean.recurring : t.boolean.oneTime
        }
      />
      <DetailItem
        label={t.fields.existingContractNumber}
        value={
          detail.detail.existing_contract_number ?? messages.common.notProvided
        }
      />
      <DetailItem
        label={t.fields.currentProvider}
        value={detail.detail.current_provider ?? messages.common.notProvided}
      />
      <DetailItem
        label={t.fields.renewalNotificationDate}
        value={
          detail.detail.renewal_notification_date
            ? formatDate(detail.detail.renewal_notification_date, locale)
            : messages.common.notProvided
        }
      />
    </DetailGrid>
  );
}
