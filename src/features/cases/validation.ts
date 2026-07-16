import { z } from "zod";

import type { Messages } from "@/lib/i18n/messages";

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

export function createCaseFormSchema(
  messages: Messages["cases"]["validation"],
) {
  return z
    .object({
      workCategory: z.enum([
        "medical_device",
        "medical_equipment",
        "service_contract",
      ]),
      title: z.string().trim().min(3, messages.title),
      description: z.preprocess(emptyToNull, z.string().trim().nullable()),
      requestingDepartmentId: z.string().uuid(messages.required),
      fiscalYearId: z.string().uuid(messages.required),
      budgetCategoryId: z.string().uuid(messages.required),
      budgetSourceId: z.string().uuid(messages.required),
      estimatedValue: z.coerce.number().finite().min(0, messages.nonNegative),
      finalValue: z.preprocess(
        emptyToNull,
        z.coerce.number().finite().min(0, messages.nonNegative).nullable(),
      ),
      procurementTypeId: z.string().uuid(messages.required),
      priority: z.enum(["normal", "urgent", "critical"]),
      caseOwnerId: z.string().uuid(messages.required),
      responsibilityType: z.enum(["none", "user", "department"]),
      responsibleId: z.preprocess(emptyToNull, z.string().uuid().nullable()),
      targetCompletionDate: z.preprocess(
        emptyToNull,
        z.string().date(messages.date).nullable(),
      ),
      itemName: z.string().trim().optional(),
      quantity: z.coerce
        .number()
        .int(messages.wholeNumber)
        .positive(messages.positive)
        .optional(),
      unit: z.string().trim().optional(),
      estimatedUnitPrice: z.coerce
        .number()
        .finite()
        .min(0, messages.nonNegative)
        .optional(),
      intendedUse: z.string().trim().optional(),
      deviceClassification: z.string().trim().optional(),
      isReusable: z.enum(["true", "false"]).optional(),
      equipmentName: z.string().trim().optional(),
      purchaseKind: z.enum(["new_purchase", "replacement"]).optional(),
      installationLocation: z.string().trim().optional(),
      replacedAssetReference: z.string().trim().optional(),
      expectedInstallationDate: z.preprocess(
        emptyToNull,
        z.string().date(messages.date).nullable().optional(),
      ),
      warrantyRequired: z.enum(["true", "false"]).optional(),
      maintenanceRequired: z.enum(["true", "false"]).optional(),
      scopeOfService: z.string().trim().optional(),
      contractStartDate: z.string().optional(),
      contractEndDate: z.string().optional(),
      isRecurring: z.enum(["true", "false"]).optional(),
      existingContractNumber: z.string().trim().optional(),
      currentProvider: z.string().trim().optional(),
      renewalNotificationDate: z.preprocess(
        emptyToNull,
        z.string().date(messages.date).nullable().optional(),
      ),
    })
    .superRefine((data, context) => {
      if (data.responsibilityType !== "none" && !data.responsibleId) {
        context.addIssue({
          code: "custom",
          path: ["responsibleId"],
          message: messages.required,
        });
      }

      const requireText = (
        field: keyof typeof data,
        value: string | undefined,
      ) => {
        if (!value) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: messages.required,
          });
        }
      };

      if (data.workCategory === "medical_device") {
        requireText("itemName", data.itemName);
        requireText("unit", data.unit);
        requireText("intendedUse", data.intendedUse);
        requireText("deviceClassification", data.deviceClassification);
        if (data.estimatedUnitPrice === undefined) {
          context.addIssue({
            code: "custom",
            path: ["estimatedUnitPrice"],
            message: messages.required,
          });
        }
        if (data.quantity === undefined) {
          context.addIssue({
            code: "custom",
            path: ["quantity"],
            message: messages.required,
          });
        }
        if (data.isReusable === undefined) {
          context.addIssue({
            code: "custom",
            path: ["isReusable"],
            message: messages.required,
          });
        }
      }

      if (data.workCategory === "medical_equipment") {
        requireText("equipmentName", data.equipmentName);
        requireText("installationLocation", data.installationLocation);
        if (!data.purchaseKind) {
          context.addIssue({
            code: "custom",
            path: ["purchaseKind"],
            message: messages.required,
          });
        }
        if (data.quantity === undefined) {
          context.addIssue({
            code: "custom",
            path: ["quantity"],
            message: messages.required,
          });
        }
        if (
          data.purchaseKind === "replacement" &&
          !data.replacedAssetReference
        ) {
          context.addIssue({
            code: "custom",
            path: ["replacedAssetReference"],
            message: messages.replacementReference,
          });
        }
      }

      if (data.workCategory === "service_contract") {
        requireText("scopeOfService", data.scopeOfService);
        requireText("contractStartDate", data.contractStartDate);
        requireText("contractEndDate", data.contractEndDate);
        if (
          data.contractStartDate &&
          data.contractEndDate &&
          data.contractEndDate < data.contractStartDate
        ) {
          context.addIssue({
            code: "custom",
            path: ["contractEndDate"],
            message: messages.endAfterStart,
          });
        }
      }
    });
}

export type CaseFormInput = z.input<ReturnType<typeof createCaseFormSchema>>;
export type CaseFormValues = z.output<ReturnType<typeof createCaseFormSchema>>;
