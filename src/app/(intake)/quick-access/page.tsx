import { QuickAccessPage } from "@/features/quick-access/components/quick-access-page";
import { getQuickAccessSearchState } from "@/features/quick-access/queries/quick-access-queries";

export const dynamic = "force-dynamic";

type QuickAccessRouteProps = {
  searchParams: Promise<{
    plate?: string;
    lastName?: string;
  }>;
};

export default async function QuickAccessRoute({
  searchParams,
}: QuickAccessRouteProps) {
  const { plate, lastName } = await searchParams;
  const searchState = await getQuickAccessSearchState({ plate, lastName });

  return <QuickAccessPage searchState={searchState} />;
}
