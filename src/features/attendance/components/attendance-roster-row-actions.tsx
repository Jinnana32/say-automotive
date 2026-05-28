"use client";

import { CalendarClock } from "lucide-react";

import { IconActionButton } from "@/components/shared/icon-action";
import { StaffScheduleDialog } from "@/features/attendance/components/staff-schedule-dialog";
import type { StaffScheduleSummary } from "@/features/attendance/types";

export function AttendanceRosterRowActions({
  schedule,
  staffId,
  staffName,
}: {
  schedule: StaffScheduleSummary | null;
  staffId: string;
  staffName: string;
}) {
  return (
    <StaffScheduleDialog
      staffId={staffId}
      staffName={staffName}
      schedule={schedule}
      trigger={({ openDialog }) => (
        <IconActionButton
          label={`Edit schedule for ${staffName}`}
          icon={CalendarClock}
          onClick={openDialog}
        />
      )}
    />
  );
}
