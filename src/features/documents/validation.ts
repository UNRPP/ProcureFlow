import { z } from "zod";

export const maximumDocumentBytes = 25 * 1024 * 1024;
export const allowedDocumentMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
] as const;

export function documentMetadataSchema(required: string) {
  return z.object({
    caseId: z.string().uuid(),
    stageInstanceId: z.string().uuid().nullable(),
    documentId: z.string().uuid().nullable(),
    documentTypeId: z.string().uuid(),
    title: z.string().trim().min(2, required).max(200, required),
    description: z.string().trim().max(2000, required),
    versionDescription: z.string().trim().max(1000, required),
  });
}

export function commentSchema(message: string) {
  return z.object({
    caseId: z.string().uuid(),
    body: z.string().trim().min(1, message).max(4000, message),
  });
}

export function sanitizeStorageFilename(filename: string): string {
  const leaf = filename.replaceAll("\\", "/").split("/").pop() ?? "file";
  const cleaned = leaf
    .normalize("NFKC")
    .replace(/[^\p{L}\p{M}\p{N}._-]+/gu, "_")
    .replace(/^\.+/, "")
    .slice(-180);
  return cleaned || "file";
}

export function validateDocumentFile(
  file: File,
): { valid: true } | { valid: false; reason: "type" | "size" } {
  if (
    !allowedDocumentMimeTypes.includes(
      file.type as (typeof allowedDocumentMimeTypes)[number],
    )
  ) {
    return { valid: false, reason: "type" };
  }
  if (file.size < 1 || file.size > maximumDocumentBytes) {
    return { valid: false, reason: "size" };
  }
  return { valid: true };
}
