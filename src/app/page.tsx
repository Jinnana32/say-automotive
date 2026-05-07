import { PublicSiteShell } from "@/features/website/components/public-site-shell";
import { WebsiteHomePage } from "@/features/website/components/website-home-page";
import { getWebsiteShellData } from "@/features/website/queries/website-queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const shellData = await getWebsiteShellData();

  return (
    <PublicSiteShell shellData={shellData}>
      <WebsiteHomePage />
    </PublicSiteShell>
  );
}
