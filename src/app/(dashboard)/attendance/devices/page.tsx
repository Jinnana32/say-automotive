import { AttendanceDevicesPageContent } from "@/features/attendance/components/attendance-devices-page-content";
import { getAttendanceDevicesPageData } from "@/features/attendance/queries/attendance-amendment-queries";

export const dynamic = "force-dynamic";

export default async function AttendanceDevicesPage() {
  const data = await getAttendanceDevicesPageData();

  return <AttendanceDevicesPageContent data={data} />;
}
