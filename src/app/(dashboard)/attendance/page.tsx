import { AttendancePageContent } from "@/features/attendance/components/attendance-page-content";
import { getAttendanceRosterData } from "@/features/attendance/queries/attendance-queries";
import { resolveAttendancePageFilters } from "@/features/attendance/utils";

export const dynamic = "force-dynamic";

type AttendancePageProps = {
  searchParams: Promise<{
    date?: string;
    search?: string;
    role?: string;
    status?: string;
  }>;
};

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const filters = resolveAttendancePageFilters(await searchParams);
  const rosterData = await getAttendanceRosterData(filters);

  return <AttendancePageContent data={rosterData} />;
}
