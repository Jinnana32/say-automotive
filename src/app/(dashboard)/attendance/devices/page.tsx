import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AttendanceDevicesPage() {
  redirect("/settings/timekeeping?tab=devices");
}
