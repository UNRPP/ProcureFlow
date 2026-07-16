import { NextResponse } from "next/server";

import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/queries/profile";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  const [{ versionId }, { messages }, currentUser] = await Promise.all([
    params,
    getI18n(),
    getCurrentProfile(),
  ]);
  if (!currentUser) {
    return NextResponse.json(
      { error: messages.cases.errors.unauthorized },
      { status: 401 },
    );
  }
  const supabase = await createClient();
  const { data: version, error } = await supabase
    .from("case_document_versions")
    .select("id, storage_bucket, storage_path")
    .eq("id", versionId)
    .single();
  if (error || !version) {
    return NextResponse.json(
      { error: messages.documents.errors.downloadFailed },
      { status: 404 },
    );
  }
  const { data, error: signedError } = await supabase.storage
    .from(version.storage_bucket)
    .createSignedUrl(version.storage_path, 60, { download: true });
  if (signedError || !data.signedUrl) {
    return NextResponse.json(
      { error: messages.documents.errors.downloadFailed },
      { status: 503 },
    );
  }
  return NextResponse.redirect(data.signedUrl, 302);
}
