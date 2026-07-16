"use client";

import { LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Messages } from "@/lib/i18n/messages";
import {
  signIn,
  type SignInErrorCode,
  type SignInState,
} from "@/server/actions/auth";

const initialState: SignInState = {};

export function SignInForm({
  messages,
  initialError,
  passwordResetComplete = false,
  nextPath,
}: {
  messages: Messages["auth"];
  initialError?: SignInErrorCode;
  passwordResetComplete?: boolean;
  nextPath: string;
}) {
  const [state, formAction, pending] = useActionState(signIn, {
    ...initialState,
    error: initialError,
  });

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{messages.errors[state.error]}</AlertDescription>
        </Alert>
      ) : null}
      {passwordResetComplete ? (
        <Alert>
          <AlertDescription>{messages.passwordUpdated}</AlertDescription>
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

      <div className="space-y-2">
        <Label htmlFor="password">{messages.password}</Label>
        <div className="relative">
          <LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={12}
            placeholder={messages.passwordPlaceholder}
            className="bg-card h-11 pl-10"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          className="text-primary text-sm font-medium hover:underline"
          href="/forgot-password"
        >
          {messages.forgotPassword}
        </Link>
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={pending}
      >
        {pending ? messages.submitting : messages.submit}
      </Button>
    </form>
  );
}
