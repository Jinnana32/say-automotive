import { MechanicPortalAttendancePage } from "@/features/attendance/components/mechanic-portal-attendance-page";
import { getMechanicPortalAttendancePageData } from "@/features/attendance/queries/attendance-amendment-queries";

export const dynamic = "force-dynamic";

export default async function MechanicPortalAttendanceRoute() {
  const data = await getMechanicPortalAttendancePageData();

  return <MechanicPortalAttendancePage data={data} />;
}
