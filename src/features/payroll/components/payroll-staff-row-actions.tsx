"use client";

import { useState } from "react";
import { CalendarClock, HandCoins } from "lucide-react";

import { TableRowActionsMenu, TableRowActionsMenuButton } from "@/components/shared/table-row-actions-menu";
import { StaffScheduleDialog } from "@/features/attendance/components/staff-schedule-dialog";
import type { StaffScheduleSummary } from "@/features/attendance/types";
import { CompensationProfileDialog } from "@/features/payroll/components/compensation-profile-dialog";
import type { CompensationProfileSummary } from "@/features/payroll/types";

export function PayrollStaffRowActions({
  staffId,
  staffName,
  schedule,
  profile,
  label,
}: {
  staffId: string;
  staffName: string;
  schedule: StaffScheduleSummary | null;
  profile: CompensationProfileSummary | null;
  label?: string;
}) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isCompensationOpen, setIsCompensationOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu label={label ?? `Open row actions for ${staffName}`}>
        <TableRowActionsMenuButton
          label="Edit schedule"
          icon={CalendarClock}
          onSelect={() => setIsScheduleOpen(true)}
        />
        <TableRowActionsMenuButton
          label="Edit compensation"
          icon={HandCoins}
          onSelect={() => setIsCompensationOpen(true)}
        />
      </TableRowActionsMenu>

      <StaffScheduleDialog
        staffId={staffId}
        staffName={staffName}
        schedule={schedule}
        showTrigger={false}
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
      />

      <CompensationProfileDialog
        staffId={staffId}
        staffName={staffName}
        profile={profile}
        showTrigger={false}
        open={isCompensationOpen}
        onOpenChange={setIsCompensationOpen}
      />
    </>
  );
}
