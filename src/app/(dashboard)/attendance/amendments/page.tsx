import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AttendanceAmendmentsPage() {
  redirect("/attendance?tab=amendments");
}
