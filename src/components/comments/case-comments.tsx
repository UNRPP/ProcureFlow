"use client";

import { LoaderCircle, MessageSquarePlus } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import type { Messages } from "@/lib/i18n/messages";
import {
  addCaseCommentAction,
  type CollaborationActionState,
} from "@/server/actions/collaboration";
import type { CaseCollaborationData } from "@/server/queries/collaboration";

const initialState: CollaborationActionState = { status: "idle", message: "" };

export function CaseComments({
  caseId,
  comments,
  canComment,
  locale,
  messages,
}: {
  caseId: string;
  comments: CaseCollaborationData["comments"];
  canComment: boolean;
  locale: Locale;
  messages: Messages;
}) {
  const [state, action, pending] = useActionState(
    addCaseCommentAction,
    initialState,
  );
  const t = messages.comments;
  return (
    <section className="bg-card rounded-2xl border">
      <div className="border-b px-4 py-3.5 sm:px-5">
        <h2 className="font-semibold">{t.title}</h2>
        <p className="text-muted-foreground mt-1 text-xs">{t.description}</p>
      </div>
      <div className="p-4 sm:p-5">
        {canComment ? (
          <form action={action} className="space-y-2">
            <input type="hidden" name="caseId" value={caseId} />
            <Textarea
              name="body"
              placeholder={t.placeholder}
              maxLength={4000}
              required
            />
            <div className="flex items-center justify-between gap-3">
              <p
                className={
                  state.status === "error"
                    ? "text-destructive text-xs"
                    : "text-success-foreground text-xs"
                }
                aria-live="polite"
              >
                {state.message}
              </p>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <MessageSquarePlus />
                )}
                {pending ? t.adding : t.add}
              </Button>
            </div>
          </form>
        ) : null}
        {comments.length ? (
          <ol className={`${canComment ? "mt-5 border-t pt-4" : ""} space-y-4`}>
            {comments.map((comment) => (
              <li key={comment.id} className="flex gap-3 text-sm">
                <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap">{comment.body}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {comment.author?.full_name ?? messages.common.notProvided} ·{" "}
                    {formatDate(comment.created_at, locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm">{t.empty}</p>
        )}
      </div>
    </section>
  );
}
