"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { transitionRequiresReason } from "@/features/workflows/rules";
import { getI18n } from "@/lib/i18n/server";
import { logServerError } from "@/lib/observability/server";
import { canEditCase } from "@/lib/permissions/cases";
import { createClient } from "@/lib/supabase/server";
import { getCaseById } from "@/server/queries/cases";
import { getCurrentProfile } from "@/server/queries/profile";
import { getWorkflowTemplate } from "@/server/queries/workflows";

export type WorkflowActionState =
  | { status: "success"; message: string; id?: string }
  | { status: "error"; message: string };

async function requireWorkflowAdmin() {
  const [{ messages }, currentUser] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
  ]);
  return {
    messages,
    currentUser: currentUser?.roles.includes("super_admin")
      ? currentUser
      : null,
  };
}

const templateSchema = z.object({
  code: z.string().regex(/^[a-z][a-z0-9_]*$/),
  nameEn: z.string().trim().min(1),
  nameTh: z.string().trim().min(1),
  descriptionEn: z.string().trim().optional(),
  descriptionTh: z.string().trim().optional(),
  procurementTypeId: z.string().uuid(),
});

export async function createWorkflowTemplateAction(
  input: z.input<typeof templateSchema>,
): Promise<WorkflowActionState> {
  const { messages, currentUser } = await requireWorkflowAdmin();
  if (!currentUser) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: messages.cases.errors.validation };
  }
  const supabase = await createClient();
  const { data: versions, error: versionError } = await supabase
    .from("workflow_templates")
    .select("version")
    .eq("code", parsed.data.code)
    .order("version", { ascending: false })
    .limit(1);
  if (versionError) {
    return { status: "error", message: messages.workflows.errors.saveFailed };
  }
  const { data, error } = await supabase
    .from("workflow_templates")
    .insert({
      code: parsed.data.code,
      version: (versions?.[0]?.version ?? 0) + 1,
      name_en: parsed.data.nameEn,
      name_th: parsed.data.nameTh,
      description_en: parsed.data.descriptionEn || null,
      description_th: parsed.data.descriptionTh || null,
      procurement_type_id: parsed.data.procurementTypeId,
      status: "draft",
      created_by: currentUser.profile.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    logServerError("workflow.template_create_failed", error);
    return { status: "error", message: messages.workflows.errors.saveFailed };
  }
  revalidatePath("/settings/workflows");
  return {
    status: "success",
    message: messages.workflows.messages.saved,
    id: data.id,
  };
}

const stepSchema = z.object({
  id: z.string().uuid().optional(),
  templateId: z.string().uuid(),
  stepKey: z.string().regex(/^[a-z][a-z0-9_]*$/),
  nameEn: z.string().trim().min(1),
  nameTh: z.string().trim().min(1),
  descriptionEn: z.string().trim().optional(),
  descriptionTh: z.string().trim().optional(),
  targetDays: z.coerce.number().int().min(0).max(3650),
  responsibilityType: z.enum(["none", "role", "department"]),
  responsibilityId: z.string().uuid().nullable().optional(),
  requiredDocumentBehavior: z.enum(["none", "warn", "block"]),
  canSkip: z.boolean(),
});

export async function saveWorkflowStepAction(
  input: z.input<typeof stepSchema>,
): Promise<WorkflowActionState> {
  const { messages, currentUser } = await requireWorkflowAdmin();
  if (!currentUser) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const parsed = stepSchema.safeParse(input);
  if (
    !parsed.success ||
    (parsed.data.responsibilityType !== "none" && !parsed.data.responsibilityId)
  ) {
    return { status: "error", message: messages.cases.errors.validation };
  }
  const detail = await getWorkflowTemplate(parsed.data.templateId);
  if (!detail || detail.template.status !== "draft") {
    return {
      status: "error",
      message: messages.workflows.errors.draftOnly,
    };
  }
  const supabase = await createClient();
  const values = {
    template_id: parsed.data.templateId,
    step_key: parsed.data.stepKey,
    name_en: parsed.data.nameEn,
    name_th: parsed.data.nameTh,
    description_en: parsed.data.descriptionEn || null,
    description_th: parsed.data.descriptionTh || null,
    default_responsible_role_id:
      parsed.data.responsibilityType === "role"
        ? parsed.data.responsibilityId
        : null,
    default_responsible_department_id:
      parsed.data.responsibilityType === "department"
        ? parsed.data.responsibilityId
        : null,
    target_days: parsed.data.targetDays,
    required_document_behavior: parsed.data.requiredDocumentBehavior,
    can_skip: parsed.data.canSkip,
    is_active: true,
  };
  const result = parsed.data.id
    ? await supabase
        .from("workflow_template_steps")
        .update(values)
        .eq("id", parsed.data.id)
        .eq("template_id", parsed.data.templateId)
    : await supabase.from("workflow_template_steps").insert({
        ...values,
        sequence: detail.steps.length + 1,
      });
  if (result.error) {
    logServerError("workflow.step_save_failed", result.error);
    return { status: "error", message: messages.workflows.errors.saveFailed };
  }
  revalidatePath("/settings/workflows/" + parsed.data.templateId);
  return { status: "success", message: messages.workflows.messages.saved };
}

export async function reorderWorkflowStepsAction(
  templateId: string,
  orderedStepIds: string[],
): Promise<WorkflowActionState> {
  const { messages, currentUser } = await requireWorkflowAdmin();
  if (
    !currentUser ||
    !z.string().uuid().safeParse(templateId).success ||
    orderedStepIds.some((id) => !z.string().uuid().safeParse(id).success)
  ) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_workflow_steps", {
    target_template_id: templateId,
    ordered_step_ids: orderedStepIds,
  });
  if (error) {
    logServerError("workflow.reorder_failed", error);
    return { status: "error", message: messages.workflows.errors.saveFailed };
  }
  revalidatePath("/settings/workflows/" + templateId);
  return { status: "success", message: messages.workflows.messages.saved };
}

export async function deleteWorkflowStepAction(
  templateId: string,
  stepId: string,
): Promise<WorkflowActionState> {
  const { messages, currentUser } = await requireWorkflowAdmin();
  if (!currentUser) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("workflow_template_steps")
    .delete()
    .eq("id", stepId)
    .eq("template_id", templateId);
  if (error) {
    return { status: "error", message: messages.workflows.errors.draftOnly };
  }
  revalidatePath("/settings/workflows/" + templateId);
  return { status: "success", message: messages.workflows.messages.saved };
}

export async function setWorkflowTemplateStatusAction(
  templateId: string,
  status: "published" | "archived",
): Promise<WorkflowActionState> {
  const { messages, currentUser } = await requireWorkflowAdmin();
  if (!currentUser) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("workflow_templates")
    .update({
      status,
      published_at:
        status === "published" ? new Date().toISOString() : undefined,
      archived_at: status === "archived" ? new Date().toISOString() : undefined,
    })
    .eq("id", templateId);
  if (error) {
    logServerError("workflow.status_change_failed", error);
    return {
      status: "error",
      message:
        status === "published"
          ? messages.workflows.errors.publishFailed
          : messages.workflows.errors.saveFailed,
    };
  }
  revalidatePath("/settings/workflows");
  revalidatePath("/settings/workflows/" + templateId);
  return { status: "success", message: messages.workflows.messages.saved };
}

export async function duplicateWorkflowTemplateAction(
  templateId: string,
): Promise<WorkflowActionState> {
  const { messages, currentUser } = await requireWorkflowAdmin();
  if (!currentUser) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("duplicate_workflow_template", {
    source_template_id: templateId,
  });
  if (error || !data) {
    return { status: "error", message: messages.workflows.errors.saveFailed };
  }
  revalidatePath("/settings/workflows");
  return {
    status: "success",
    message: messages.workflows.messages.duplicated,
    id: data,
  };
}

export async function startCaseWorkflowAction(
  caseId: string,
  templateId: string,
): Promise<WorkflowActionState> {
  const [{ messages }, currentUser, procurementCase] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
    getCaseById(caseId),
  ]);
  if (
    !currentUser ||
    !procurementCase ||
    !canEditCase({
      roles: currentUser.roles,
      status: procurementCase.case.status,
      userId: currentUser.profile.id,
      ownerId: procurementCase.case.case_owner_id,
      responsibleUserId: procurementCase.case.current_responsible_user_id,
    })
  ) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_case_workflow", {
    target_case_id: caseId,
    selected_template_id: templateId,
  });
  if (error || !data) {
    logServerError("workflow.start_failed", error);
    return { status: "error", message: messages.workflows.errors.startFailed };
  }
  revalidatePath("/cases/" + caseId);
  revalidatePath("/cases");
  return {
    status: "success",
    message: messages.workflows.messages.started,
    id: data,
  };
}

const transitionSchema = z.object({
  action: z.enum([
    "complete",
    "return",
    "reassign",
    "hold",
    "resume",
    "skip",
    "cancel",
    "complete_case",
  ]),
  reason: z.string().trim().optional(),
  responsibleType: z.enum(["user", "department"]).optional(),
  responsibleId: z.string().uuid().optional(),
});

export async function transitionCaseWorkflowAction(
  caseId: string,
  input: z.input<typeof transitionSchema>,
): Promise<WorkflowActionState> {
  const [{ messages }, currentUser, procurementCase] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
    getCaseById(caseId),
  ]);
  const parsed = transitionSchema.safeParse(input);
  if (!parsed.success || !currentUser || !procurementCase) {
    return { status: "error", message: messages.cases.errors.validation };
  }
  const requiresReason = transitionRequiresReason(parsed.data.action);
  if (
    (requiresReason && !parsed.data.reason) ||
    (parsed.data.action === "reassign" &&
      (!parsed.data.responsibleType || !parsed.data.responsibleId)) ||
    !canEditCase({
      roles: currentUser.roles,
      status: procurementCase.case.status,
      userId: currentUser.profile.id,
      ownerId: procurementCase.case.case_owner_id,
      responsibleUserId: procurementCase.case.current_responsible_user_id,
    })
  ) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("transition_case_workflow", {
    target_case_id: caseId,
    transition_action: parsed.data.action,
    transition_reason: parsed.data.reason || null,
    target_user_id:
      parsed.data.responsibleType === "user" ? parsed.data.responsibleId : null,
    target_department_id:
      parsed.data.responsibleType === "department"
        ? parsed.data.responsibleId
        : null,
  });
  if (error || !data) {
    logServerError("workflow.transition_failed", error);
    return {
      status: "error",
      message: messages.workflows.errors.transitionFailed,
    };
  }
  revalidatePath("/cases/" + caseId);
  revalidatePath("/cases");
  return {
    status: "success",
    message: messages.workflows.messages.transitioned,
    id: data,
  };
}
