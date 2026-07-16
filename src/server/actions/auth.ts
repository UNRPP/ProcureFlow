"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { localeCookieName } from "@/lib/i18n/config";
import { getPublicEnvironment } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  passwordResetRequestSchema,
  passwordUpdateSchema,
  signInSchema,
} from "@/features/auth/validation";

export type SignInErrorCode =
  | "invalidForm"
  | "invalidCredentials"
  | "inactiveAccount"
  | "serviceUnavailable"
  | "callbackFailed";

export type SignInState = { error?: SignInErrorCode };

export type PasswordResetRequestState = {
  error?: "invalidForm" | "serviceUnavailable";
  sent?: boolean;
};

export type PasswordUpdateState = {
  error?:
    | "invalidForm"
    | "passwordMismatch"
    | "invalidRecoverySession"
    | "serviceUnavailable";
};

export async function signIn(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "invalidForm" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword(parsed.data);

    if (error || !user) {
      return { error: "invalidCredentials" };
    }

    // The password is verified by the user-scoped Auth client above. Resolve the
    // application profile with the server-only client so this request does not
    // depend on a just-issued session cookie being readable immediately.
    const { data: profile, error: profileError } = await createAdminClient()
      .from("profiles")
      .select("locale, is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error(
        "Unable to resolve the signed-in user profile",
        profileError,
      );
      await supabase.auth.signOut();
      return { error: "serviceUnavailable" };
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      return { error: "inactiveAccount" };
    }

    const cookieStore = await cookies();
    cookieStore.set(localeCookieName, profile.locale, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
    });
  } catch (error) {
    console.error("Sign-in request failed", error);
    return { error: "serviceUnavailable" };
  }

  redirect(parsed.data.next);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Unable to end the authenticated session");
  }

  redirect("/sign-in");
}

export async function requestPasswordReset(
  _previousState: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) return { error: "invalidForm" };

  try {
    const environment = getPublicEnvironment();
    const callbackUrl = new URL(
      "/auth/callback",
      environment.NEXT_PUBLIC_SITE_URL,
    );
    callbackUrl.searchParams.set("next", "/reset-password");

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: callbackUrl.toString(),
      },
    );

    if (error) return { error: "serviceUnavailable" };
    return { sent: true };
  } catch {
    return { error: "serviceUnavailable" };
  }
}

export async function updatePassword(
  _previousState: PasswordUpdateState,
  formData: FormData,
): Promise<PasswordUpdateState> {
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) {
    return formData.get("password") !== formData.get("passwordConfirmation")
      ? { error: "passwordMismatch" }
      : { error: "invalidForm" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { error: "invalidRecoverySession" };

    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) return { error: "serviceUnavailable" };

    await supabase.auth.signOut();
  } catch {
    return { error: "serviceUnavailable" };
  }

  redirect("/sign-in?reset=success");
}
