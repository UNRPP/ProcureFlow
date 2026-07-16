import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile, RoleCode } from "@/types/database";

export type CurrentProfile = {
  profile: Profile;
  roles: RoleCode[];
};

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Authenticated user profile is unavailable");
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id);

  if (membershipsError) {
    throw new Error("Role memberships are unavailable");
  }

  const roleIds = memberships.map((membership) => membership.role_id);
  if (roleIds.length === 0) {
    return { profile, roles: [] };
  }

  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("code")
    .in("id", roleIds)
    .eq("is_active", true);

  if (rolesError) {
    throw new Error("Role definitions are unavailable");
  }

  return { profile, roles: roles.map((role) => role.code) };
}
