import type { CaseStatus, RoleCode } from "@/types/database";

const elevatedRoles: RoleCode[] = ["super_admin", "procurement_manager"];

export function canCreateCase(roles: RoleCode[]): boolean {
  return roles.some((role) =>
    ["super_admin", "procurement_manager", "procurement_officer"].includes(
      role,
    ),
  );
}

export function canEditCase({
  roles,
  status,
  userId,
  ownerId,
  responsibleUserId,
}: {
  roles: RoleCode[];
  status: CaseStatus;
  userId: string;
  ownerId: string;
  responsibleUserId: string | null;
}): boolean {
  if (roles.includes("super_admin")) return true;
  if (roles.includes("procurement_manager")) return true;
  if (["completed", "cancelled"].includes(status)) return false;
  if (roles.some((role) => elevatedRoles.includes(role))) return true;
  return (
    roles.includes("procurement_officer") &&
    (ownerId === userId || responsibleUserId === userId)
  );
}
