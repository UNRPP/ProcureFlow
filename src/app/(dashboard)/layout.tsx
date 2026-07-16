import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getI18n } from "@/lib/i18n/server";
import { getNotificationFeed } from "@/server/queries/collaboration";
import { getCurrentProfile } from "@/server/queries/profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, i18n] = await Promise.all([
    getCurrentProfile(),
    getI18n(),
  ]);

  if (!currentUser) {
    redirect("/sign-in");
  }

  if (!currentUser.profile.is_active) {
    redirect("/account-inactive");
  }

  const notifications = await getNotificationFeed();

  const primaryRole = currentUser.roles[0];
  const roleLabel = primaryRole
    ? i18n.messages.roles[primaryRole]
    : i18n.messages.roles.unassigned;

  return (
    <AppShell
      locale={i18n.locale}
      messages={i18n.messages}
      user={{
        fullName: currentUser.profile.full_name,
        email: currentUser.profile.email,
        roleLabel,
      }}
      notifications={notifications ?? { items: [], unreadCount: 0 }}
    >
      {children}
    </AppShell>
  );
}
