import { TimekeepingCalendarPageContent } from "@/features/attendance/components/timekeeping-calendar-page-content";
import { getTimekeepingCalendarPageData } from "@/features/attendance/queries/timekeeping-queries";

export const dynamic = "force-dynamic";

export default async function TimekeepingSettingsPage() {
  const data = await getTimekeepingCalendarPageData();

  return <TimekeepingCalendarPageContent data={data} />;
}
