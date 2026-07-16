"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCaseFormSchema,
  type CaseFormInput,
  type CaseFormValues,
} from "@/features/cases/validation";
import type { Locale } from "@/lib/i18n/config";
import { localizedMasterDataName } from "@/lib/i18n/master-data";
import type { Messages } from "@/lib/i18n/messages";
import { createCaseAction, updateCaseAction } from "@/server/actions/cases";
import type { CaseFormOptions } from "@/server/queries/cases";
import type { WorkCategoryCode } from "@/types/database";

const selectClassName =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

type CaseFormProps = {
  category: WorkCategoryCode;
  initialValues: CaseFormInput;
  locale: Locale;
  messages: Messages;
  options: CaseFormOptions;
  caseId?: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-destructive mt-1 text-xs" role="alert">
      {message}
    </p>
  );
}

export function CaseForm({
  category,
  initialValues,
  locale,
  messages,
  options,
  caseId,
}: CaseFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = createCaseFormSchema(messages.cases.validation);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CaseFormInput, unknown, CaseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });
  const responsibilityType = useWatch({ control, name: "responsibilityType" });
  const purchaseKind = useWatch({ control, name: "purchaseKind" });
  const t = messages.cases;
  const masterLabel = (item: { name_en: string; name_th: string }) =>
    localizedMasterDataName(item, locale);

  async function onSubmit(values: CaseFormValues) {
    setFormError(null);
    const result = caseId
      ? await updateCaseAction(caseId, values)
      : await createCaseAction(values);
    if (result.status === "error") {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof CaseFormInput, { message });
        });
      }
      setFormError(result.message);
      return;
    }
    router.push(`/cases/${result.caseId}?saved=1`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {formError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t.errors.saveTitle}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <input type="hidden" {...register("workCategory")} value={category} />

      <section className="bg-card rounded-2xl border">
        <div className="border-b px-4 py-4 sm:px-6">
          <h2 className="font-semibold">{t.sections.summary}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.sections.summaryDescription}
          </p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2">
            <Label htmlFor="title">{t.fields.title}</Label>
            <Input
              id="title"
              className="mt-2"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              {...register("title")}
            />
            <FieldError id="title-error" message={errors.title?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">{t.fields.description}</Label>
            <Textarea
              id="description"
              className="mt-2"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
              {...register("description")}
            />
            <FieldError
              id="description-error"
              message={errors.description?.message}
            />
          </div>
          <div>
            <Label htmlFor="requestingDepartmentId">
              {t.fields.requestingDepartment}
            </Label>
            <select
              id="requestingDepartmentId"
              className={`${selectClassName} mt-2`}
              aria-invalid={Boolean(errors.requestingDepartmentId)}
              aria-describedby={
                errors.requestingDepartmentId
                  ? "requestingDepartmentId-error"
                  : undefined
              }
              {...register("requestingDepartmentId")}
            >
              <option value="">{messages.common.selectOption}</option>
              {options.departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {masterLabel(item)}
                </option>
              ))}
            </select>
            <FieldError
              id="requestingDepartmentId-error"
              message={errors.requestingDepartmentId?.message}
            />
          </div>
          <div>
            <Label htmlFor="priority">{t.fields.priority}</Label>
            <select
              id="priority"
              className={`${selectClassName} mt-2`}
              {...register("priority")}
            >
              {(["normal", "urgent", "critical"] as const).map((priority) => (
                <option key={priority} value={priority}>
                  {t.priorities[priority]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="targetCompletionDate">
              {t.fields.targetCompletionDate}
            </Label>
            <Input
              id="targetCompletionDate"
              type="date"
              className="mt-2"
              aria-invalid={Boolean(errors.targetCompletionDate)}
              aria-describedby={
                errors.targetCompletionDate
                  ? "targetCompletionDate-error"
                  : undefined
              }
              {...register("targetCompletionDate")}
            />
            <FieldError
              id="targetCompletionDate-error"
              message={errors.targetCompletionDate?.message}
            />
          </div>
        </div>
      </section>

      <section className="bg-card rounded-2xl border">
        <div className="border-b px-4 py-4 sm:px-6">
          <h2 className="font-semibold">{t.sections.budget}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.sections.budgetDescription}
          </p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <div>
            <Label htmlFor="fiscalYearId">{t.fields.fiscalYear}</Label>
            <select
              id="fiscalYearId"
              className={`${selectClassName} mt-2`}
              aria-invalid={Boolean(errors.fiscalYearId)}
              aria-describedby={
                errors.fiscalYearId ? "fiscalYearId-error" : undefined
              }
              {...register("fiscalYearId")}
            >
              <option value="">{messages.common.selectOption}</option>
              {options.fiscalYears.map((item) => (
                <option key={item.id} value={item.id}>
                  {masterLabel(item)}
                </option>
              ))}
            </select>
            <FieldError
              id="fiscalYearId-error"
              message={errors.fiscalYearId?.message}
            />
          </div>
          <div>
            <Label htmlFor="procurementTypeId">
              {t.fields.procurementType}
            </Label>
            <select
              id="procurementTypeId"
              className={`${selectClassName} mt-2`}
              aria-invalid={Boolean(errors.procurementTypeId)}
              aria-describedby={
                errors.procurementTypeId ? "procurementTypeId-error" : undefined
              }
              {...register("procurementTypeId")}
            >
              <option value="">{messages.common.selectOption}</option>
              {options.procurementTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {masterLabel(item)}
                </option>
              ))}
            </select>
            <FieldError
              id="procurementTypeId-error"
              message={errors.procurementTypeId?.message}
            />
          </div>
          <div>
            <Label htmlFor="budgetCategoryId">{t.fields.budgetCategory}</Label>
            <select
              id="budgetCategoryId"
              className={`${selectClassName} mt-2`}
              aria-invalid={Boolean(errors.budgetCategoryId)}
              aria-describedby={
                errors.budgetCategoryId ? "budgetCategoryId-error" : undefined
              }
              {...register("budgetCategoryId")}
            >
              <option value="">{messages.common.selectOption}</option>
              {options.budgetCategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {masterLabel(item)}
                </option>
              ))}
            </select>
            <FieldError
              id="budgetCategoryId-error"
              message={errors.budgetCategoryId?.message}
            />
          </div>
          <div>
            <Label htmlFor="budgetSourceId">{t.fields.budgetSource}</Label>
            <select
              id="budgetSourceId"
              className={`${selectClassName} mt-2`}
              aria-invalid={Boolean(errors.budgetSourceId)}
              aria-describedby={
                errors.budgetSourceId ? "budgetSourceId-error" : undefined
              }
              {...register("budgetSourceId")}
            >
              <option value="">{messages.common.selectOption}</option>
              {options.budgetSources.map((item) => (
                <option key={item.id} value={item.id}>
                  {masterLabel(item)}
                </option>
              ))}
            </select>
            <FieldError
              id="budgetSourceId-error"
              message={errors.budgetSourceId?.message}
            />
          </div>
          <div>
            <Label htmlFor="estimatedValue">{t.fields.estimatedValue}</Label>
            <Input
              id="estimatedValue"
              type="number"
              min="0"
              step="0.01"
              className="mt-2"
              aria-invalid={Boolean(errors.estimatedValue)}
              aria-describedby={
                errors.estimatedValue ? "estimatedValue-error" : undefined
              }
              {...register("estimatedValue", { valueAsNumber: true })}
            />
            <FieldError
              id="estimatedValue-error"
              message={errors.estimatedValue?.message}
            />
          </div>
          <div>
            <Label htmlFor="finalValue">{t.fields.finalValue}</Label>
            <Input
              id="finalValue"
              type="number"
              min="0"
              step="0.01"
              className="mt-2"
              aria-invalid={Boolean(errors.finalValue)}
              aria-describedby={
                errors.finalValue ? "finalValue-error" : undefined
              }
              {...register("finalValue", {
                setValueAs: (value) =>
                  value === "" ? null : Number(value as string),
              })}
            />
            <FieldError
              id="finalValue-error"
              message={errors.finalValue?.message}
            />
          </div>
        </div>
      </section>

      <section className="bg-card rounded-2xl border">
        <div className="border-b px-4 py-4 sm:px-6">
          <h2 className="font-semibold">{t.sections.responsibility}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.sections.responsibilityDescription}
          </p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <div>
            <Label htmlFor="caseOwnerId">{t.fields.caseOwner}</Label>
            <select
              id="caseOwnerId"
              className={`${selectClassName} mt-2`}
              aria-invalid={Boolean(errors.caseOwnerId)}
              aria-describedby={
                errors.caseOwnerId ? "caseOwnerId-error" : undefined
              }
              {...register("caseOwnerId")}
            >
              <option value="">{messages.common.selectOption}</option>
              {options.profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </select>
            <FieldError
              id="caseOwnerId-error"
              message={errors.caseOwnerId?.message}
            />
          </div>
          <div>
            <Label htmlFor="responsibilityType">
              {t.fields.responsibilityType}
            </Label>
            <select
              id="responsibilityType"
              className={`${selectClassName} mt-2`}
              {...register("responsibilityType")}
            >
              <option value="none">{t.responsibility.none}</option>
              <option value="user">{t.responsibility.user}</option>
              <option value="department">{t.responsibility.department}</option>
            </select>
          </div>
          {responsibilityType !== "none" ? (
            <div className="sm:col-span-2">
              <Label htmlFor="responsibleId">
                {responsibilityType === "user"
                  ? t.fields.responsibleUser
                  : t.fields.responsibleDepartment}
              </Label>
              <select
                id="responsibleId"
                className={`${selectClassName} mt-2`}
                aria-invalid={Boolean(errors.responsibleId)}
                aria-describedby={
                  errors.responsibleId ? "responsibleId-error" : undefined
                }
                {...register("responsibleId")}
              >
                <option value="">{messages.common.selectOption}</option>
                {responsibilityType === "user"
                  ? options.profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </option>
                    ))
                  : options.departments.map((item) => (
                      <option key={item.id} value={item.id}>
                        {masterLabel(item)}
                      </option>
                    ))}
              </select>
              <FieldError
                id="responsibleId-error"
                message={errors.responsibleId?.message}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-card rounded-2xl border">
        <div className="border-b px-4 py-4 sm:px-6">
          <h2 className="font-semibold">{t.categories[category]}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.sections.categoryDescription}
          </p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          {category === "medical_device" ? (
            <>
              <TextField
                id="itemName"
                label={t.fields.itemName}
                register={register}
                error={errors.itemName?.message}
              />
              <NumberField
                id="quantity"
                label={t.fields.quantity}
                register={register}
                error={errors.quantity?.message}
              />
              <TextField
                id="unit"
                label={t.fields.unit}
                register={register}
                error={errors.unit?.message}
              />
              <NumberField
                id="estimatedUnitPrice"
                label={t.fields.estimatedUnitPrice}
                register={register}
                error={errors.estimatedUnitPrice?.message}
                step="0.01"
              />
              <TextField
                id="deviceClassification"
                label={t.fields.deviceClassification}
                register={register}
                error={errors.deviceClassification?.message}
              />
              <div>
                <Label htmlFor="isReusable">{t.fields.reusable}</Label>
                <select
                  id="isReusable"
                  className={`${selectClassName} mt-2`}
                  {...register("isReusable")}
                >
                  <option value="true">{t.boolean.reusable}</option>
                  <option value="false">{t.boolean.consumable}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="intendedUse">{t.fields.intendedUse}</Label>
                <Textarea
                  id="intendedUse"
                  className="mt-2"
                  aria-invalid={Boolean(errors.intendedUse)}
                  aria-describedby={
                    errors.intendedUse ? "intendedUse-error" : undefined
                  }
                  {...register("intendedUse")}
                />
                <FieldError
                  id="intendedUse-error"
                  message={errors.intendedUse?.message}
                />
              </div>
            </>
          ) : null}

          {category === "medical_equipment" ? (
            <>
              <TextField
                id="equipmentName"
                label={t.fields.equipmentName}
                register={register}
                error={errors.equipmentName?.message}
              />
              <NumberField
                id="quantity"
                label={t.fields.quantity}
                register={register}
                error={errors.quantity?.message}
              />
              <div>
                <Label htmlFor="purchaseKind">{t.fields.purchaseKind}</Label>
                <select
                  id="purchaseKind"
                  className={`${selectClassName} mt-2`}
                  {...register("purchaseKind")}
                >
                  <option value="new_purchase">
                    {t.purchaseKinds.new_purchase}
                  </option>
                  <option value="replacement">
                    {t.purchaseKinds.replacement}
                  </option>
                </select>
              </div>
              <TextField
                id="installationLocation"
                label={t.fields.installationLocation}
                register={register}
                error={errors.installationLocation?.message}
              />
              {purchaseKind === "replacement" ? (
                <TextField
                  id="replacedAssetReference"
                  label={t.fields.replacedAssetReference}
                  register={register}
                  error={errors.replacedAssetReference?.message}
                />
              ) : null}
              <div>
                <Label htmlFor="expectedInstallationDate">
                  {t.fields.expectedInstallationDate}
                </Label>
                <Input
                  id="expectedInstallationDate"
                  type="date"
                  className="mt-2"
                  {...register("expectedInstallationDate")}
                />
              </div>
              <BooleanSelect
                id="warrantyRequired"
                label={t.fields.warrantyRequired}
                register={register}
                messages={t.boolean}
              />
              <BooleanSelect
                id="maintenanceRequired"
                label={t.fields.maintenanceRequired}
                register={register}
                messages={t.boolean}
              />
            </>
          ) : null}

          {category === "service_contract" ? (
            <>
              <div className="sm:col-span-2">
                <Label htmlFor="scopeOfService">
                  {t.fields.scopeOfService}
                </Label>
                <Textarea
                  id="scopeOfService"
                  className="mt-2"
                  aria-invalid={Boolean(errors.scopeOfService)}
                  aria-describedby={
                    errors.scopeOfService ? "scopeOfService-error" : undefined
                  }
                  {...register("scopeOfService")}
                />
                <FieldError
                  id="scopeOfService-error"
                  message={errors.scopeOfService?.message}
                />
              </div>
              <div>
                <Label htmlFor="contractStartDate">
                  {t.fields.contractStartDate}
                </Label>
                <Input
                  id="contractStartDate"
                  type="date"
                  className="mt-2"
                  aria-invalid={Boolean(errors.contractStartDate)}
                  aria-describedby={
                    errors.contractStartDate
                      ? "contractStartDate-error"
                      : undefined
                  }
                  {...register("contractStartDate")}
                />
                <FieldError
                  id="contractStartDate-error"
                  message={errors.contractStartDate?.message}
                />
              </div>
              <div>
                <Label htmlFor="contractEndDate">
                  {t.fields.contractEndDate}
                </Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  className="mt-2"
                  aria-invalid={Boolean(errors.contractEndDate)}
                  aria-describedby={
                    errors.contractEndDate ? "contractEndDate-error" : undefined
                  }
                  {...register("contractEndDate")}
                />
                <FieldError
                  id="contractEndDate-error"
                  message={errors.contractEndDate?.message}
                />
              </div>
              <BooleanSelect
                id="isRecurring"
                label={t.fields.recurring}
                register={register}
                messages={{
                  yes: t.boolean.recurring,
                  no: t.boolean.oneTime,
                  reusable: "",
                  consumable: "",
                }}
              />
              <TextField
                id="existingContractNumber"
                label={t.fields.existingContractNumber}
                register={register}
                error={errors.existingContractNumber?.message}
              />
              <TextField
                id="currentProvider"
                label={t.fields.currentProvider}
                register={register}
                error={errors.currentProvider?.message}
              />
              <div>
                <Label htmlFor="renewalNotificationDate">
                  {t.fields.renewalNotificationDate}
                </Label>
                <Input
                  id="renewalNotificationDate"
                  type="date"
                  className="mt-2"
                  {...register("renewalNotificationDate")}
                />
              </div>
            </>
          ) : null}
        </div>
      </section>

      <div className="bg-background/92 sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t py-3 backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          {messages.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
          {isSubmitting ? t.actions.saving : t.actions.save}
        </Button>
      </div>
    </form>
  );
}

type Register = ReturnType<typeof useForm<CaseFormInput>>["register"];

function TextField({
  id,
  label,
  register,
  error,
}: {
  id: keyof CaseFormInput;
  label: string;
  register: Register;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="mt-2"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register(id)}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function NumberField({
  id,
  label,
  register,
  error,
  step = "1",
}: {
  id: "quantity" | "estimatedUnitPrice";
  label: string;
  register: Register;
  error?: string;
  step?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="0"
        step={step}
        className="mt-2"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register(id, { valueAsNumber: true })}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function BooleanSelect({
  id,
  label,
  register,
  messages,
}: {
  id: "warrantyRequired" | "maintenanceRequired" | "isRecurring";
  label: string;
  register: Register;
  messages: { yes: string; no: string; reusable: string; consumable: string };
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={`${selectClassName} mt-2`} {...register(id)}>
        <option value="true">{messages.yes}</option>
        <option value="false">{messages.no}</option>
      </select>
    </div>
  );
}
