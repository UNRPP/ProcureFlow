import "server-only";

import { logServerError } from "@/lib/observability/server";
import { createClient } from "@/lib/supabase/server";
import type { Database, MasterDataRecord, Profile } from "@/types/database";

export type WorkflowTemplate =
  Database["public"]["Tables"]["workflow_templates"]["Row"];
export type WorkflowTemplateStep =
  Database["public"]["Tables"]["workflow_template_steps"]["Row"];
export type CaseWorkflow =
  Database["public"]["Tables"]["case_workflows"]["Row"];
export type CaseStage =
  Database["public"]["Tables"]["case_stage_instances"]["Row"];
export type WorkflowTransition =
  Database["public"]["Tables"]["workflow_transition_events"]["Row"];
export type CaseActivity =
  Database["public"]["Tables"]["case_activity_events"]["Row"];

export type WorkflowTemplateListItem = WorkflowTemplate & {
  procurementType: MasterDataRecord | null;
  stepCount: number;
};

export type WorkflowTemplateDetail = {
  template: WorkflowTemplate;
  steps: WorkflowTemplateStep[];
  departments: MasterDataRecord[];
  roles: {
    id: string;
    code: string;
    name_en: string;
    name_th: string;
  }[];
  documentTypes: MasterDataRecord[];
  documentRequirements: Database["public"]["Tables"]["workflow_step_document_requirements"]["Row"][];
};

export type CaseWorkflowData = {
  workflow: CaseWorkflow | null;
  stages: CaseStage[];
  transitions: (WorkflowTransition & {
    actor: Pick<Profile, "id" | "full_name"> | null;
  })[];
  activities: (CaseActivity & {
    actor: Pick<Profile, "id" | "full_name"> | null;
  })[];
  currentStage: CaseStage | null;
  publishedTemplates: WorkflowTemplate[];
  profiles: Pick<Profile, "id" | "full_name">[];
  departments: MasterDataRecord[];
};

export async function listWorkflowTemplates(): Promise<
  WorkflowTemplateListItem[] | null
> {
  const supabase = await createClient();
  const [templatesResult, stepsResult, typesResult] = await Promise.all([
    supabase
      .from("workflow_templates")
      .select("*")
      .order("code")
      .order("version", { ascending: false }),
    supabase.from("workflow_template_steps").select("template_id"),
    supabase
      .from("procurement_types")
      .select(
        "id, code, name_en, name_th, is_active, archived_at, created_at, updated_at",
      ),
  ]);
  if (templatesResult.error || stepsResult.error || typesResult.error) {
    logServerError(
      "workflow.template_list_failed",
      templatesResult.error ?? stepsResult.error ?? typesResult.error,
    );
    return null;
  }
  const types = new Map(
    (typesResult.data ?? []).map((item) => [item.id, item]),
  );
  const counts = new Map<string, number>();
  (stepsResult.data ?? []).forEach((step) =>
    counts.set(step.template_id, (counts.get(step.template_id) ?? 0) + 1),
  );
  return (templatesResult.data ?? []).map((template) => ({
    ...template,
    procurementType: types.get(template.procurement_type_id) ?? null,
    stepCount: counts.get(template.id) ?? 0,
  }));
}

export async function getWorkflowTemplate(
  id: string,
): Promise<WorkflowTemplateDetail | null> {
  const supabase = await createClient();
  const [
    templateResult,
    stepsResult,
    departmentsResult,
    rolesResult,
    documentTypesResult,
    documentRequirementsResult,
  ] = await Promise.all([
    supabase.from("workflow_templates").select("*").eq("id", id).single(),
    supabase
      .from("workflow_template_steps")
      .select("*")
      .eq("template_id", id)
      .order("sequence"),
    supabase
      .from("departments")
      .select(
        "id, code, name_en, name_th, is_active, archived_at, created_at, updated_at",
      )
      .order("name_en"),
    supabase
      .from("roles")
      .select("id, code, name_en, name_th")
      .eq("is_active", true)
      .order("name_en"),
    supabase.from("document_types").select("*").order("name_en"),
    supabase.from("workflow_step_document_requirements").select("*"),
  ]);
  if (
    templateResult.error ||
    stepsResult.error ||
    departmentsResult.error ||
    rolesResult.error ||
    documentTypesResult.error ||
    documentRequirementsResult.error
  ) {
    return null;
  }
  return {
    template: templateResult.data,
    steps: stepsResult.data ?? [],
    departments: departmentsResult.data ?? [],
    roles: rolesResult.data ?? [],
    documentTypes: (documentTypesResult.data ?? []).filter(
      (item) => item.is_active,
    ),
    documentRequirements: (documentRequirementsResult.data ?? []).filter(
      (requirement) =>
        (stepsResult.data ?? []).some(
          (step) => step.id === requirement.template_step_id,
        ),
    ),
  };
}

export async function getCaseWorkflow(
  caseId: string,
  procurementTypeId: string,
): Promise<CaseWorkflowData | null> {
  const supabase = await createClient();
  const [
    workflowResult,
    stagesResult,
    transitionsResult,
    activitiesResult,
    templatesResult,
    profilesResult,
    departmentsResult,
  ] = await Promise.all([
    supabase
      .from("case_workflows")
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle(),
    supabase
      .from("case_stage_instances")
      .select("*")
      .eq("case_id", caseId)
      .order("sequence")
      .order("iteration"),
    supabase
      .from("workflow_transition_events")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("case_activity_events")
      .select("*")
      .eq("case_id", caseId)
      .order("occurred_at", { ascending: false })
      .limit(100),
    supabase
      .from("workflow_templates")
      .select("*")
      .eq("procurement_type_id", procurementTypeId)
      .eq("status", "published")
      .order("version", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("departments")
      .select(
        "id, code, name_en, name_th, is_active, archived_at, created_at, updated_at",
      )
      .order("name_en"),
  ]);
  const error =
    workflowResult.error ??
    stagesResult.error ??
    transitionsResult.error ??
    activitiesResult.error ??
    templatesResult.error ??
    profilesResult.error ??
    departmentsResult.error;
  if (error) {
    logServerError("workflow.case_query_failed", error);
    return null;
  }
  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const stages = stagesResult.data ?? [];
  return {
    workflow: workflowResult.data,
    stages,
    transitions: (transitionsResult.data ?? []).map((event) => ({
      ...event,
      actor: profiles.get(event.performed_by) ?? null,
    })),
    activities: (activitiesResult.data ?? []).map((event) => ({
      ...event,
      actor: event.actor_id ? (profiles.get(event.actor_id) ?? null) : null,
    })),
    currentStage: stages.find((stage) => stage.status === "active") ?? null,
    publishedTemplates: templatesResult.data ?? [],
    profiles: profilesResult.data ?? [],
    departments: departmentsResult.data ?? [],
  };
}
