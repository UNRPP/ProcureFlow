"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Messages } from "@/lib/i18n/messages";
import {
  requestPasswordReset,
  type PasswordResetRequestState,
} from "@/server/actions/auth";

const initialState: PasswordResetRequestState = {};

export function ForgotPasswordForm({
  messages,
}: {
  messages: Messages["auth"];
}) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{messages.errors[state.error]}</AlertDescription>
        </Alert>
      ) : null}
      {state.sent ? (
        <Alert>
          <AlertDescription>{messages.resetLinkSent}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">{messages.email}</Label>
        <div className="relative">
          <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={messages.emailPlaceholder}
            className="bg-card h-11 pl-10"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={pending}
      >
        {pending ? messages.sendingResetLink : messages.sendResetLink}
      </Button>

      <Link
        className="text-primary block text-center text-sm font-medium hover:underline"
        href="/sign-in"
      >
        {messages.backToSignIn}
      </Link>
    </form>
  );
}
