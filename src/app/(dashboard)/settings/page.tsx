import { DatabaseZap, GitBranch, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { MasterDataList } from "@/components/settings/master-data-list";
import { DemoDataControls } from "@/components/settings/demo-data-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { getMasterDataCatalog } from "@/server/queries/master-data";
import { getCurrentProfile } from "@/server/queries/profile";

export default async function SettingsPage() {
  const [{ locale, messages }, masterData, currentUser] = await Promise.all([
    getI18n(),
    getMasterDataCatalog(),
    getCurrentProfile(),
  ]);

  return (
    <>
      <PageHeader
        title={messages.settings.title}
        description={messages.settings.description}
      />

      <Alert className="border-info/30 bg-info/8 mb-5">
        <ShieldCheck className="text-info-foreground" />
        <AlertTitle>{messages.settings.managementTitle}</AlertTitle>
        <AlertDescription>
          {messages.settings.managementDescription}
        </AlertDescription>
      </Alert>

      {currentUser?.roles.includes("super_admin") ? (
        <>
          <div className="mb-5 flex justify-end">
            <Link
              href="/settings/workflows"
              className={buttonVariants({ variant: "outline" })}
            >
              <GitBranch />
              {messages.workflows.manageLink}
            </Link>
          </div>
          <DemoDataControls messages={messages} />
        </>
      ) : null}

      <div className="mb-4">
        <h2 className="text-base font-semibold">
          {messages.settings.masterDataTitle}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {messages.settings.masterDataDescription}
        </p>
      </div>

      {masterData.status === "ready" ? (
        <MasterDataList
          catalog={masterData.data}
          locale={locale}
          messages={messages}
          canManage={currentUser?.roles.includes("super_admin") ?? false}
        />
      ) : (
        <Alert variant="destructive">
          <DatabaseZap />
          <AlertTitle>{messages.dashboard.dataUnavailableTitle}</AlertTitle>
          <AlertDescription>
            {messages.dashboard.dataUnavailableDescription}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
