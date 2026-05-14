import { PageHeader } from "@/components/shared/page-header";
import { SettingsPageTabs } from "@/features/settings/components/settings-page-tabs";
import { getSettingsPageData } from "@/features/settings/queries/settings-queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settingsPage = await getSettingsPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Business identity, billing behavior, and numbering controls."
      />

      <SettingsPageTabs
        settings={settingsPage.settings}
        documentSequences={settingsPage.documentSequences}
      />
    </div>
  );
}
