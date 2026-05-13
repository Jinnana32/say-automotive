import { AttendanceAmendmentsPageContent } from "@/features/attendance/components/attendance-amendments-page-content";
import { getAttendanceAmendmentsPageData } from "@/features/attendance/queries/attendance-amendment-queries";

export const dynamic = "force-dynamic";

export default async function AttendanceAmendmentsPage() {
  const data = await getAttendanceAmendmentsPageData();

  return <AttendanceAmendmentsPageContent data={data} />;
}
