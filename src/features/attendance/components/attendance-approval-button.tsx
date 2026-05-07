import { CheckCheck, Undo2 } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { setAttendanceApprovalAction } from "@/features/attendance/actions/attendance-actions";

export function AttendanceApprovalButton({
  attendanceId,
  isApproved,
  disabled = false,
}: {
  attendanceId: string;
  isApproved: boolean;
  disabled?: boolean;
}) {
  const label = isApproved ? "Remove attendance approval" : "Approve attendance";

  async function submitApprovalAction(formData: FormData) {
    "use server";

    await setAttendanceApprovalAction(undefined, formData);
  }

  return (
    <Tooltip content={label}>
      <form action={submitApprovalAction}>
        <input type="hidden" name="attendanceId" value={attendanceId} />
        <input type="hidden" name="approvalAction" value={isApproved ? "unapprove" : "approve"} />
        <Button
          type="submit"
          size="sm"
          variant={isApproved ? "outline" : "ghost"}
          className="size-8 p-0"
          aria-label={label}
          title={label}
          disabled={disabled}
        >
          {isApproved ? <Undo2 className="size-4" /> : <CheckCheck className="size-4" />}
          <span className="sr-only">{label}</span>
        </Button>
      </form>
    </Tooltip>
  );
}
