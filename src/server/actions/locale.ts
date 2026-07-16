"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isLocale, localeCookieName, type Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) {
    throw new Error("Unsupported locale");
  }

  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase
      .from("profiles")
      .update({ locale })
      .eq("id", user.id);

    if (error) {
      throw new Error("Unable to persist the locale preference");
    }
  }

  revalidatePath("/", "layout");
}
