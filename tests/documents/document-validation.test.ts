import { describe, expect, it } from "vitest";

import {
  maximumDocumentBytes,
  sanitizeStorageFilename,
  validateDocumentFile,
} from "@/features/documents/validation";

describe("document validation", () => {
  it("sanitizes path separators and unsafe filename characters", () => {
    expect(sanitizeStorageFilename("../../Signed contract (final).pdf")).toBe(
      "Signed_contract_final_.pdf",
    );
    expect(sanitizeStorageFilename("สัญญา ฉบับจริง.pdf")).toBe(
      "สัญญา_ฉบับจริง.pdf",
    );
  });

  it("accepts allowlisted document MIME types", () => {
    const file = new File(["pdf"], "request.pdf", {
      type: "application/pdf",
    });
    expect(validateDocumentFile(file)).toEqual({ valid: true });
  });

  it("rejects executable files and empty or oversized files", () => {
    const executable = new File(["x"], "unsafe.exe", {
      type: "application/x-msdownload",
    });
    const empty = new File([], "empty.pdf", { type: "application/pdf" });
    const oversized = {
      type: "application/pdf",
      size: maximumDocumentBytes + 1,
    } as File;
    expect(validateDocumentFile(executable)).toEqual({
      valid: false,
      reason: "type",
    });
    expect(validateDocumentFile(empty)).toEqual({
      valid: false,
      reason: "size",
    });
    expect(validateDocumentFile(oversized)).toEqual({
      valid: false,
      reason: "size",
    });
  });
});
