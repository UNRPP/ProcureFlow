import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; type?: string }>;
}) {
  const params = await searchParams;
  if (params.code) {
    const callback = new URLSearchParams({
      code: params.code,
      next: "/reset-password",
    });
    redirect(`/auth/callback?${callback.toString()}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/sign-in");
}
