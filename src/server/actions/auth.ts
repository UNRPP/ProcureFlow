"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { localeCookieName } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/features/auth/validation";

export type SignInErrorCode =
  | "invalidForm"
  | "invalidCredentials"
  | "inactiveAccount"
  | "serviceUnavailable"
  | "callbackFailed";

export type SignInState = { error?: SignInErrorCode };

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
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return { error: "invalidCredentials" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("locale, is_active")
      .single();

    if (profileError || !profile) {
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
  } catch {
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
