import { QuickAccessPage } from "@/features/quick-access/components/quick-access-page";
import { getQuickAccessSearchState } from "@/features/quick-access/queries/quick-access-queries";

export const dynamic = "force-dynamic";

type QuickAccessRouteProps = {
  searchParams: Promise<{
    q?: string;
    plate?: string;
    lastName?: string;
  }>;
};

export default async function QuickAccessRoute({
  searchParams,
}: QuickAccessRouteProps) {
  const { q, plate, lastName } = await searchParams;
  const searchState = await getQuickAccessSearchState({
    query: q,
    plate,
    lastName,
  });

  return <QuickAccessPage searchState={searchState} />;
}
