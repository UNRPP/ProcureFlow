"use client";

import { KeyRound, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Messages } from "@/lib/i18n/messages";
import {
  updatePassword,
  type PasswordUpdateState,
} from "@/server/actions/auth";

const initialState: PasswordUpdateState = {};

export function ResetPasswordForm({
  messages,
}: {
  messages: Messages["auth"];
}) {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{messages.errors[state.error]}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">{messages.newPassword}</Label>
        <div className="relative">
          <LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            placeholder={messages.newPasswordPlaceholder}
            className="bg-card h-11 pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirmation">{messages.confirmPassword}</Label>
        <div className="relative">
          <KeyRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            placeholder={messages.confirmPasswordPlaceholder}
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
        {pending ? messages.updatingPassword : messages.updatePassword}
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
