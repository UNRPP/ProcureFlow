import "server-only";

import { logServerError } from "@/lib/observability/server";
import { createClient } from "@/lib/supabase/server";
import { listCasesForExport } from "@/server/queries/cases";
import type { Database, MasterDataRecord, Profile } from "@/types/database";

type Requirement =
  Database["public"]["Tables"]["case_stage_document_requirements"]["Row"];
type CaseDocument = Database["public"]["Tables"]["case_documents"]["Row"];
type DocumentVersion =
  Database["public"]["Tables"]["case_document_versions"]["Row"];
type CaseComment = Database["public"]["Tables"]["case_comments"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export type CaseDocumentItem = CaseDocument & {
  documentType: MasterDataRecord | null;
  versions: (DocumentVersion & {
    uploader: Pick<Profile, "id" | "full_name"> | null;
  })[];
};

export type CaseCollaborationData = {
  documentTypes: MasterDataRecord[];
  requirements: (Requirement & { uploaded: boolean })[];
  documents: CaseDocumentItem[];
  comments: (CaseComment & {
    author: Pick<Profile, "id" | "full_name"> | null;
  })[];
};

export type NotificationFeed = {
  items: Notification[];
  unreadCount: number;
};

export type ContractRenewal = {
  caseId: string;
  caseNumber: string;
  title: string;
  contractStartDate: string;
  contractEndDate: string;
  renewalNotificationDate: string | null;
  currentProvider: string | null;
};

export async function getCaseCollaboration(
  caseId: string,
  currentStageId: string | null,
): Promise<CaseCollaborationData | null> {
  const supabase = await createClient();
  const requirementsQuery = currentStageId
    ? supabase
        .from("case_stage_document_requirements")
        .select("*")
        .eq("case_id", caseId)
        .eq("stage_instance_id", currentStageId)
    : Promise.resolve({ data: [], error: null });
  const [
    typesResult,
    requirementsResult,
    documentsResult,
    commentsResult,
    profilesResult,
  ] = await Promise.all([
    supabase.from("document_types").select("*").order("name_en"),
    requirementsQuery,
    supabase
      .from("case_documents")
      .select("*")
      .eq("case_id", caseId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("case_comments")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
  ]);
  const error =
    typesResult.error ??
    requirementsResult.error ??
    documentsResult.error ??
    commentsResult.error ??
    profilesResult.error;
  if (error) {
    logServerError("collaboration.case_query_failed", error);
    return null;
  }
  const documents = documentsResult.data ?? [];
  const documentIds = documents.map((document) => document.id);
  const versionsResult = documentIds.length
    ? await supabase
        .from("case_document_versions")
        .select("*")
        .in("document_id", documentIds)
        .order("version_number", { ascending: false })
    : { data: [], error: null };
  if (versionsResult.error) {
    logServerError("document.version_query_failed", versionsResult.error);
    return null;
  }
  const types = new Map(
    (typesResult.data ?? []).map((documentType) => [
      documentType.id,
      documentType,
    ]),
  );
  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const versionsByDocument = new Map<string, CaseDocumentItem["versions"]>();
  (versionsResult.data ?? []).forEach((version) => {
    versionsByDocument.set(version.document_id, [
      ...(versionsByDocument.get(version.document_id) ?? []),
      { ...version, uploader: profiles.get(version.uploaded_by) ?? null },
    ]);
  });
  const uploadedRequirements = new Set(
    documents.map(
      (item) => `${item.stage_instance_id ?? "case"}:${item.document_type_id}`,
    ),
  );
  return {
    documentTypes: (typesResult.data ?? []).filter((item) => item.is_active),
    requirements: (requirementsResult.data ?? []).map((requirement) => ({
      ...requirement,
      uploaded: uploadedRequirements.has(
        `${requirement.stage_instance_id}:${requirement.document_type_id}`,
      ),
    })),
    documents: documents.map((document) => ({
      ...document,
      documentType: types.get(document.document_type_id) ?? null,
      versions: versionsByDocument.get(document.id) ?? [],
    })),
    comments: (commentsResult.data ?? []).map((comment) => ({
      ...comment,
      author: profiles.get(comment.author_id) ?? null,
    })),
  };
}

export async function getNotificationFeed(): Promise<NotificationFeed | null> {
  const supabase = await createClient();
  const [itemsResult, countResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);
  const error = itemsResult.error ?? countResult.error;
  if (error) {
    logServerError("notification.feed_query_failed", error);
    return null;
  }
  return { items: itemsResult.data ?? [], unreadCount: countResult.count ?? 0 };
}

export async function getContractRenewals(): Promise<ContractRenewal[] | null> {
  const supabase = await createClient();
  const [detailsResult, cases] = await Promise.all([
    supabase
      .from("service_contract_case_details")
      .select(
        "case_id, contract_start_date, contract_end_date, renewal_notification_date, current_provider",
      ),
    listCasesForExport(),
  ]);
  if (detailsResult.error || !cases) {
    logServerError("contract.renewal_query_failed", detailsResult.error);
    return null;
  }
  const casesById = new Map(cases.map((item) => [item.id, item]));
  return (detailsResult.data ?? [])
    .flatMap((detail) => {
      const procurementCase = casesById.get(detail.case_id);
      if (
        !procurementCase ||
        !["draft", "active", "on_hold"].includes(procurementCase.status)
      ) {
        return [];
      }
      return [
        {
          caseId: procurementCase.id,
          caseNumber: procurementCase.case_number,
          title: procurementCase.title,
          contractStartDate: detail.contract_start_date,
          contractEndDate: detail.contract_end_date,
          renewalNotificationDate: detail.renewal_notification_date,
          currentProvider: detail.current_provider,
        },
      ];
    })
    .sort(
      (a, b) =>
        new Date(a.contractEndDate).getTime() -
        new Date(b.contractEndDate).getTime(),
    );
}
