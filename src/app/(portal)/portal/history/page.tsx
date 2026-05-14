import { MechanicPortalHistoryPage } from "@/features/attendance/components/mechanic-portal-history-page";
import { getMechanicPortalHistoryPageData } from "@/features/attendance/queries/attendance-amendment-queries";

export const dynamic = "force-dynamic";

export default async function MechanicPortalHistoryRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const month = typeof params.month === "string" ? params.month : undefined;
  const data = await getMechanicPortalHistoryPageData(month);

  return <MechanicPortalHistoryPage key={`${data.month}:${data.initialSelectedDate}`} data={data} />;
}
