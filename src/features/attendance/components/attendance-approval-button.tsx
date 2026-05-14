import { CheckCheck, Undo2 } from "lucide-react";

import { useId } from "react";

import { Button } from "@/components/ui/button";
import { submitAttendanceApprovalAction } from "@/features/attendance/actions/attendance-approval-actions";

export function AttendanceApprovalButton({
  attendanceId,
  isApproved,
  disabled = false,
  trigger,
}: {
  attendanceId: string;
  isApproved: boolean;
  disabled?: boolean;
  trigger?: (controls: { submit: () => void }) => React.ReactNode;
}) {
  const label = isApproved ? "Remove attendance approval" : "Approve attendance";
  const formId = useId();

  return (
    <form id={formId} action={submitAttendanceApprovalAction}>
      <input type="hidden" name="attendanceId" value={attendanceId} />
      <input type="hidden" name="approvalAction" value={isApproved ? "unapprove" : "approve"} />
      {trigger ? (
        trigger({
          submit: () => {
            const form = document.getElementById(formId) as HTMLFormElement | null;
            form?.requestSubmit();
          },
        })
      ) : (
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
      )}
    </form>
  );
}
