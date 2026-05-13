import { MechanicPortalAmendmentsPage } from "@/features/attendance/components/mechanic-portal-amendments-page";
import { getMechanicPortalAmendmentsPageData } from "@/features/attendance/queries/attendance-amendment-queries";

export const dynamic = "force-dynamic";

export default async function MechanicPortalAmendmentsRoute() {
  const data = await getMechanicPortalAmendmentsPageData();

  return <MechanicPortalAmendmentsPage data={data} />;
}
