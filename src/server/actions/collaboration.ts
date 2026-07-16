"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  commentSchema,
  documentMetadataSchema,
  sanitizeStorageFilename,
  validateDocumentFile,
} from "@/features/documents/validation";
import { getI18n } from "@/lib/i18n/server";
import { logServerError } from "@/lib/observability/server";
import { canEditCase } from "@/lib/permissions/cases";
import { createClient } from "@/lib/supabase/server";
import { getCaseById } from "@/server/queries/cases";
import { getCurrentProfile } from "@/server/queries/profile";

export type CollaborationActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function uploadDocumentAction(
  _previous: CollaborationActionState,
  formData: FormData,
): Promise<CollaborationActionState> {
  const [{ messages }, currentUser] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
  ]);
  const t = messages.documents;
  const nullable = (value: FormDataEntryValue | null) => {
    const text = String(value ?? "").trim();
    return text || null;
  };
  const parsed = documentMetadataSchema(t.errors.invalid).safeParse({
    caseId: String(formData.get("caseId") ?? ""),
    stageInstanceId: nullable(formData.get("stageInstanceId")),
    documentId: nullable(formData.get("documentId")),
    documentTypeId: String(formData.get("documentTypeId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    versionDescription: String(formData.get("versionDescription") ?? ""),
  });
  const file = formData.get("file");
  if (!parsed.success || !(file instanceof File)) {
    return { status: "error", message: t.errors.invalid };
  }
  const fileValidation = validateDocumentFile(file);
  if (!fileValidation.valid) {
    return {
      status: "error",
      message:
        fileValidation.reason === "type"
          ? t.errors.fileType
          : t.errors.fileSize,
    };
  }
  const detail = await getCaseById(parsed.data.caseId);
  if (
    !currentUser ||
    !detail ||
    !canEditCase({
      roles: currentUser.roles,
      status: detail.case.status,
      userId: currentUser.profile.id,
      ownerId: detail.case.case_owner_id,
      responsibleUserId: detail.case.current_responsible_user_id,
    })
  ) {
    return { status: "error", message: t.errors.unauthorized };
  }
  const supabase = await createClient();
  let stageInstanceId = parsed.data.stageInstanceId;
  if (parsed.data.documentId) {
    const { data: existingDocument, error } = await supabase
      .from("case_documents")
      .select("case_id, stage_instance_id, document_type_id")
      .eq("id", parsed.data.documentId)
      .single();
    if (
      error ||
      !existingDocument ||
      existingDocument.case_id !== parsed.data.caseId ||
      existingDocument.document_type_id !== parsed.data.documentTypeId
    ) {
      return { status: "error", message: t.errors.invalid };
    }
    stageInstanceId = existingDocument.stage_instance_id;
  } else if (
    stageInstanceId &&
    stageInstanceId !== detail.case.current_stage_instance_id
  ) {
    return { status: "error", message: t.errors.invalid };
  }
  const documentId = parsed.data.documentId ?? randomUUID();
  const versionId = randomUUID();
  const filename = sanitizeStorageFilename(file.name);
  const storagePath = `${parsed.data.caseId}/${documentId}/${versionId}/${filename}`;
  const { error: uploadError } = await supabase.storage
    .from("case-documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    logServerError("document.storage_upload_failed", uploadError);
    return { status: "error", message: t.errors.uploadFailed };
  }
  const { error: registerError } = await supabase.rpc(
    "register_case_document_version",
    {
      target_case_id: parsed.data.caseId,
      target_stage_instance_id: stageInstanceId,
      target_document_id: documentId,
      target_version_id: versionId,
      target_document_type_id: parsed.data.documentTypeId,
      target_title: parsed.data.title,
      target_description: parsed.data.description,
      target_original_filename: filename,
      target_storage_path: storagePath,
      target_mime_type: file.type,
      target_size_bytes: file.size,
      target_version_description: parsed.data.versionDescription || null,
    },
  );
  if (registerError) {
    logServerError("document.metadata_registration_failed", registerError);
    const { error: cleanupError } = await supabase.storage
      .from("case-documents")
      .remove([storagePath]);
    if (cleanupError) {
      logServerError("document.orphan_cleanup_failed", cleanupError);
    }
    return { status: "error", message: t.errors.uploadFailed };
  }
  revalidatePath(`/cases/${parsed.data.caseId}`);
  return { status: "success", message: t.success };
}

export async function addCaseCommentAction(
  _previous: CollaborationActionState,
  formData: FormData,
): Promise<CollaborationActionState> {
  const [{ messages }, currentUser] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
  ]);
  const parsed = commentSchema(messages.comments.validation).safeParse({
    caseId: String(formData.get("caseId") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: messages.comments.validation };
  }
  if (
    !currentUser ||
    !currentUser.roles.some((role) =>
      ["super_admin", "procurement_manager", "procurement_officer"].includes(
        role,
      ),
    )
  ) {
    return { status: "error", message: messages.comments.unauthorized };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_case_comment", {
    target_case_id: parsed.data.caseId,
    comment_body: parsed.data.body,
  });
  if (error) {
    logServerError("comment.create_failed", error);
    return { status: "error", message: messages.comments.failed };
  }
  revalidatePath(`/cases/${parsed.data.caseId}`);
  return { status: "success", message: messages.comments.success };
}

export async function markNotificationReadAction(
  notificationId?: string,
): Promise<void> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (notificationId) query = query.eq("id", notificationId);
  const { error } = await query;
  if (error) logServerError("notification.read_update_failed", error);
  revalidatePath("/", "layout");
}

export async function saveDocumentRequirementAction(input: {
  templateStepId: string;
  documentTypeId: string;
  blocksCompletion: boolean;
  descriptionEn: string;
  descriptionTh: string;
}): Promise<CollaborationActionState> {
  const [{ messages }, currentUser] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
  ]);
  if (!currentUser?.roles.includes("super_admin")) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const parsed = z
    .object({
      documentTypeId: z.string().uuid(),
      templateStepId: z.string().uuid(),
      blocksCompletion: z.boolean(),
      descriptionEn: z.string().trim().max(1000),
      descriptionTh: z.string().trim().max(1000),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: messages.documents.errors.invalid };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("workflow_step_document_requirements")
    .upsert(
      {
        template_step_id: input.templateStepId,
        document_type_id: input.documentTypeId,
        is_required: true,
        blocks_completion: input.blocksCompletion,
        description_en: parsed.data.descriptionEn || null,
        description_th: parsed.data.descriptionTh || null,
      },
      { onConflict: "template_step_id,document_type_id" },
    );
  return error
    ? { status: "error", message: messages.documents.errors.invalid }
    : { status: "success", message: messages.workflows.messages.saved };
}

export async function deleteDocumentRequirementAction(
  requirementId: string,
): Promise<CollaborationActionState> {
  const [{ messages }, currentUser] = await Promise.all([
    getI18n(),
    getCurrentProfile(),
  ]);
  if (!currentUser?.roles.includes("super_admin")) {
    return { status: "error", message: messages.cases.errors.unauthorized };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("workflow_step_document_requirements")
    .delete()
    .eq("id", requirementId);
  return error
    ? { status: "error", message: messages.documents.errors.invalid }
    : { status: "success", message: messages.workflows.messages.saved };
}
