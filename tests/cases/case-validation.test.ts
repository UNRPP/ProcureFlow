import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import { createCaseFormSchema } from "@/features/cases/validation";

const base = {
  workCategory: "medical_device" as const,
  title: "Validated procurement request",
  description: "",
  requestingDepartmentId: "00000000-0000-0000-0000-000000000001",
  fiscalYearId: "00000000-0000-0000-0000-000000000002",
  budgetCategoryId: "00000000-0000-0000-0000-000000000003",
  budgetSourceId: "00000000-0000-0000-0000-000000000004",
  estimatedValue: 1200,
  finalValue: null,
  procurementTypeId: "00000000-0000-0000-0000-000000000005",
  priority: "normal" as const,
  caseOwnerId: "00000000-0000-0000-0000-000000000006",
  responsibilityType: "none" as const,
  responsibleId: null,
  targetCompletionDate: null,
  itemName: "Patient monitor",
  quantity: 2,
  unit: "units",
  estimatedUnitPrice: 600,
  intendedUse: "Ward monitoring",
  deviceClassification: "Class II",
  isReusable: "true" as const,
};

describe("case form validation", () => {
  const schema = createCaseFormSchema(en.cases.validation);

  it("accepts complete medical-device details", () => {
    expect(schema.safeParse(base).success).toBe(true);
  });

  it("requires category-specific medical-device fields", () => {
    const result = schema.safeParse({ ...base, itemName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.itemName).toContain(
        en.cases.validation.required,
      );
    }
  });

  it("requires a replaced asset for replacement equipment", () => {
    const result = schema.safeParse({
      ...base,
      workCategory: "medical_equipment",
      equipmentName: "Freezer",
      purchaseKind: "replacement",
      installationLocation: "Laboratory",
      replacedAssetReference: "",
      warrantyRequired: "true",
      maintenanceRequired: "true",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.flatten().fieldErrors.replacedAssetReference,
      ).toContain(en.cases.validation.replacementReference);
    }
  });

  it("rejects a service contract ending before it starts", () => {
    const result = schema.safeParse({
      ...base,
      workCategory: "service_contract",
      scopeOfService: "Annual calibration",
      contractStartDate: "2026-09-01",
      contractEndDate: "2026-08-31",
      isRecurring: "false",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.contractEndDate).toContain(
        en.cases.validation.endAfterStart,
      );
    }
  });
});
