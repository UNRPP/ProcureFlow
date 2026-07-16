import type { CaseFormInput } from "@/features/cases/validation";
import type { CaseDetail } from "@/server/queries/cases";
import type { WorkCategoryCode } from "@/types/database";

export function createCaseDefaults({
  category,
  ownerId,
  requestingDepartmentId,
  fiscalYearId,
  budgetCategoryId,
  budgetSourceId,
  procurementTypeId,
}: {
  category: WorkCategoryCode;
  ownerId: string;
  requestingDepartmentId?: string;
  fiscalYearId?: string;
  budgetCategoryId?: string;
  budgetSourceId?: string;
  procurementTypeId?: string;
}): CaseFormInput {
  return {
    workCategory: category,
    title: "",
    description: "",
    requestingDepartmentId: requestingDepartmentId ?? "",
    fiscalYearId: fiscalYearId ?? "",
    budgetCategoryId: budgetCategoryId ?? "",
    budgetSourceId: budgetSourceId ?? "",
    estimatedValue: 0,
    finalValue: null,
    procurementTypeId: procurementTypeId ?? "",
    priority: "normal",
    caseOwnerId: ownerId,
    responsibilityType: "none",
    responsibleId: null,
    targetCompletionDate: null,
    itemName: "",
    quantity: 1,
    unit: "",
    estimatedUnitPrice: 0,
    intendedUse: "",
    deviceClassification: "",
    isReusable: "true",
    equipmentName: "",
    purchaseKind: "new_purchase",
    installationLocation: "",
    replacedAssetReference: "",
    expectedInstallationDate: null,
    warrantyRequired: "true",
    maintenanceRequired: "true",
    scopeOfService: "",
    contractStartDate: "",
    contractEndDate: "",
    isRecurring: "false",
    existingContractNumber: "",
    currentProvider: "",
    renewalNotificationDate: null,
  };
}

export function caseDetailToFormValues(detail: CaseDetail): CaseFormInput {
  const procurementCase = detail.case;
  const base: CaseFormInput = {
    workCategory: detail.categoryCode,
    title: procurementCase.title,
    description: procurementCase.description ?? "",
    requestingDepartmentId: procurementCase.requesting_department_id,
    fiscalYearId: procurementCase.fiscal_year_id,
    budgetCategoryId: procurementCase.budget_category_id,
    budgetSourceId: procurementCase.budget_source_id,
    estimatedValue: procurementCase.estimated_value,
    finalValue: procurementCase.final_value,
    procurementTypeId: procurementCase.procurement_type_id,
    priority: procurementCase.priority,
    caseOwnerId: procurementCase.case_owner_id,
    responsibilityType: procurementCase.current_responsible_user_id
      ? "user"
      : procurementCase.current_responsible_department_id
        ? "department"
        : "none",
    responsibleId:
      procurementCase.current_responsible_user_id ??
      procurementCase.current_responsible_department_id,
    targetCompletionDate: procurementCase.target_completion_date,
    itemName: "",
    quantity: 1,
    unit: "",
    estimatedUnitPrice: 0,
    intendedUse: "",
    deviceClassification: "",
    isReusable: "true",
    equipmentName: "",
    purchaseKind: "new_purchase",
    installationLocation: "",
    replacedAssetReference: "",
    expectedInstallationDate: null,
    warrantyRequired: "true",
    maintenanceRequired: "true",
    scopeOfService: "",
    contractStartDate: "",
    contractEndDate: "",
    isRecurring: "false",
    existingContractNumber: "",
    currentProvider: "",
    renewalNotificationDate: null,
  };

  if (detail.categoryCode === "medical_device") {
    return {
      ...base,
      itemName: detail.detail.item_name,
      quantity: detail.detail.quantity,
      unit: detail.detail.unit,
      estimatedUnitPrice: detail.detail.estimated_unit_price,
      intendedUse: detail.detail.intended_use,
      deviceClassification: detail.detail.device_classification,
      isReusable: detail.detail.is_reusable ? "true" : "false",
    };
  }
  if (detail.categoryCode === "medical_equipment") {
    return {
      ...base,
      equipmentName: detail.detail.equipment_name,
      quantity: detail.detail.quantity,
      purchaseKind: detail.detail.purchase_kind,
      installationLocation: detail.detail.installation_location,
      replacedAssetReference: detail.detail.replaced_asset_reference ?? "",
      expectedInstallationDate: detail.detail.expected_installation_date,
      warrantyRequired: detail.detail.warranty_required ? "true" : "false",
      maintenanceRequired: detail.detail.maintenance_required
        ? "true"
        : "false",
    };
  }
  return {
    ...base,
    scopeOfService: detail.detail.scope_of_service,
    contractStartDate: detail.detail.contract_start_date,
    contractEndDate: detail.detail.contract_end_date,
    isRecurring: detail.detail.is_recurring ? "true" : "false",
    existingContractNumber: detail.detail.existing_contract_number ?? "",
    currentProvider: detail.detail.current_provider ?? "",
    renewalNotificationDate: detail.detail.renewal_notification_date,
  };
}
