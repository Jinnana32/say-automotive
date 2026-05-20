import { BlankDocumentPreviewComposer } from "@/components/reports/blank-document-preview-composer";
import { requireStaffCapability } from "@/lib/auth/session";
import { getSettingsPageData } from "@/features/settings/queries/settings-queries";

export const dynamic = "force-dynamic";

export default async function BlankPreviewPage() {
  await requireStaffCapability("settings:write");
  const settingsPageData = await getSettingsPageData();
  const { branchName, settings } = settingsPageData;

  return (
    <BlankDocumentPreviewComposer
      businessName={settings.businessName}
      businessLogoUrl={settings.businessLogoUrl}
      businessVatRegistrationNo={settings.businessVatRegistrationNo || null}
      businessContact={settings.businessContact || null}
      businessEmail={settings.businessEmail || null}
      businessAddress={settings.businessAddress || null}
      branchName={branchName}
    />
  );
}
