import { PublicSiteShell } from "@/features/website/components/public-site-shell";
import { getWebsiteShellData } from "@/features/website/queries/website-queries";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellData = await getWebsiteShellData();

  return <PublicSiteShell shellData={shellData}>{children}</PublicSiteShell>;
}
