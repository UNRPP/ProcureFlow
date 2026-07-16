"use server";

import { revalidatePath } from "next/cache";

import {
  createCaseFormSchema,
  type CaseFormValues,
} from "@/features/cases/validation";
import { getI18n } from "@/lib/i18n/server";
import { logServerError } from "@/lib/observability/server";
import { canCreateCase, canEditCase } from "@/lib/permissions/cases";
import { createClient } from "@/lib/supabase/server";
import { getCaseById, getCaseFormOptions } from "@/server/queries/cases";
import { getCurrentProfile } from "@/server/queries/profile";

export type CaseActionState =
  | { status: "success"; caseId: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
    };

function toPayload(values: CaseFormValues) {
  const responsibleUserId =
    values.responsibilityType === "user" ? values.responsibleId : null;
  const responsibleDepartmentId =
    values.responsibilityType === "department" ? values.responsibleId : null;
  const caseData: Record<string, unknown> = {
    work_category: values.workCategory,
    title: values.title,
    description: values.description ?? "",
    requesting_department_id: values.requestingDepartmentId,
    fiscal_year_id: values.fiscalYearId,
    budget_category_id: values.budgetCategoryId,
    budget_source_id: values.budgetSourceId,
    estimated_value: values.estimatedValue,
    final_value: values.finalValue ?? "",
    procurement_type_id: values.procurementTypeId,
    priority: values.priority,
    case_owner_id: values.caseOwnerId,
    current_responsible_user_id: responsibleUserId ?? "",
    current_responsible_department_id: responsibleDepartmentId ?? "",
    target_completion_date: values.targetCompletionDate ?? "",
  };

  let detailData: Record<string, unknown>;
  if (values.workCategory === "medical_device") {
    detailData = {
      item_name: values.itemName,
      quantity: values.quantity,
      unit: values.unit,
      estimated_unit_price: values.estimatedUnitPrice,
      intended_use: values.intendedUse,
      device_classification: values.deviceClassification,
      is_reusable: values.isReusable === "true",
    };
  } else if (values.workCategory === "medical_equipment") {
    detailData = {
      equipment_name: values.equipmentName,
      quantity: values.quantity,
      purchase_kind: values.purchaseKind,
      installation_location: values.installationLocation,
      replaced_asset_reference: values.replacedAssetReference ?? "",
      expected_installation_date: values.expectedInstallationDate ?? "",
      warranty_required: values.warrantyRequired !== "false",
      maintenance_required: values.maintenanceRequired !== "false",
    };
  } else {
    detailData = {
      scope_of_service: values.scopeOfService,
      contract_start_date: values.contractStartDate,
      contract_end_date: values.contractEndDate,
      is_recurring: values.isRecurring === "true",
      existing_contract_number: values.existingContractNumber ?? "",
      current_provider: values.currentProvider ?? "",
      renewal_notification_date: values.renewalNotificationDate ?? "",
    };
  }
  return { caseData, detailData };
}

async function validateRequest(
  input: unknown,
  allowedArchivedIds: string[] = [],
) {
  const allowed = new Set(allowedArchivedIds);
  const [{ messages }, currentUser, options] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
    getCaseFormOptions({ includeArchived: true }),
  ]);
  const parsed = createCaseFormSchema(messages.cases.validation).safeParse(
    input,
  );
  if (!parsed.success) {
    return {
      ok: false as const,
      result: {
        status: "error" as const,
        message: messages.cases.errors.validation,
        fieldErrors: Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        ),
      },
    };
  }
  if (!currentUser || !options) {
    return {
      ok: false as const,
      result: {
        status: "error" as const,
        message: messages.cases.errors.unavailable,
      },
    };
  }

  const values = parsed.data;
  const validMasterData =
    options.workCategories.some(
      (item) =>
        item.code === values.workCategory &&
        (item.is_active || allowed.has(item.id)),
    ) &&
    options.departments.some(
      (item) =>
        item.id === values.requestingDepartmentId &&
        (item.is_active || allowed.has(item.id)),
    ) &&
    options.fiscalYears.some(
      (item) =>
        item.id === values.fiscalYearId &&
        (item.is_active || allowed.has(item.id)),
    ) &&
    options.budgetCategories.some(
      (item) =>
        item.id === values.budgetCategoryId &&
        (item.is_active || allowed.has(item.id)),
    ) &&
    options.budgetSources.some(
      (item) =>
        item.id === values.budgetSourceId &&
        (item.is_active || allowed.has(item.id)),
    ) &&
    options.procurementTypes.some(
      (item) =>
        item.id === values.procurementTypeId &&
        (item.is_active || allowed.has(item.id)),
    ) &&
    options.profiles.some((profile) => profile.id === values.caseOwnerId);

  const validResponsibility =
    values.responsibilityType === "none" ||
    (values.responsibilityType === "user" &&
      options.profiles.some(
        (profile) => profile.id === values.responsibleId,
      )) ||
    (values.responsibilityType === "department" &&
      options.departments.some(
        (item) =>
          item.id === values.responsibleId &&
          (item.is_active || allowed.has(item.id)),
      ));

  if (!validMasterData || !validResponsibility) {
    return {
      ok: false as const,
      result: {
        status: "error" as const,
        message: messages.cases.errors.inactiveMasterData,
      },
    };
  }

  return { ok: true as const, values, currentUser, messages };
}

export async function createCaseAction(
  input: unknown,
): Promise<CaseActionState> {
  const validation = await validateRequest(input);
  if (!validation.ok) return validation.result;
  const { values, currentUser, messages } = validation;

  if (
    !canCreateCase(currentUser.roles) ||
    (currentUser.roles.includes("procurement_officer") &&
      !currentUser.roles.some((role) =>
        ["super_admin", "procurement_manager"].includes(role),
      ) &&
      values.caseOwnerId !== currentUser.profile.id)
  ) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }

  const { caseData, detailData } = toPayload(values);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_procurement_case", {
    case_data: caseData,
    detail_data: detailData,
  });
  if (error || !data) {
    logServerError("case.create_failed", error);
    return { status: "error", message: messages.cases.errors.saveFailed };
  }

  revalidatePath("/cases");
  revalidatePath("/dashboard");
  return { status: "success", caseId: data };
}

export async function updateCaseAction(
  caseId: string,
  input: unknown,
): Promise<CaseActionState> {
  const existing = await getCaseById(caseId);
  if (!existing) {
    const { messages } = await getI18n();
    return { status: "error", message: messages.cases.errors.notFound };
  }
  const validation = await validateRequest(input, [
    existing.case.work_category_id,
    existing.case.requesting_department_id,
    existing.case.fiscal_year_id,
    existing.case.budget_category_id,
    existing.case.budget_source_id,
    existing.case.procurement_type_id,
    existing.case.current_responsible_department_id ?? "",
  ]);
  if (!validation.ok) return validation.result;
  const { values, currentUser, messages } = validation;
  if (
    existing.categoryCode !== values.workCategory ||
    !canEditCase({
      roles: currentUser.roles,
      status: existing.case.status,
      userId: currentUser.profile.id,
      ownerId: existing.case.case_owner_id,
      responsibleUserId: existing.case.current_responsible_user_id,
    })
  ) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }

  const { caseData, detailData } = toPayload(values);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_procurement_case", {
    target_case_id: caseId,
    case_data: caseData,
    detail_data: detailData,
  });
  if (error || !data) {
    logServerError("case.update_failed", error);
    return { status: "error", message: messages.cases.errors.saveFailed };
  }

  revalidatePath("/cases");
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/edit`);
  return { status: "success", caseId: data };
}
