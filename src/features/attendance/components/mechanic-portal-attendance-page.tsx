"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { FormStatusMessage } from "@/components/shared/form-status";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recordMechanicAttendanceLogAction } from "@/features/attendance/actions/mechanic-portal-actions";
import { DtrAmendmentForm } from "@/features/attendance/components/dtr-amendment-form";
import {
  formatMechanicDeviceStatusMessage,
  formatStaffDeviceStatusLabel,
  getStaffDeviceStatusTone,
  summarizeCurrentDevice,
} from "@/features/attendance/device-utils";
import { MechanicPortalClock } from "@/features/attendance/components/mechanic-portal-clock";
import type { MechanicPortalAttendancePageData } from "@/features/attendance/types";
import {
  buildDtrAmendmentFormValues,
  formatAttendanceTime,
  formatDtrAmendmentStatusLabel,
  formatDtrAmendmentTypeLabel,
  formatMechanicAttendanceState,
  formatMechanicIpStatusMessage,
  getDtrAmendmentStatusTone,
  getMechanicPortalPrimaryActionLabel,
  getMechanicPortalPrimaryLogType,
  INITIAL_ATTENDANCE_ENTRY_ACTION_STATE,
} from "@/features/attendance/utils";
import { formatDate, formatDateTime } from "@/lib/dates";

export function MechanicPortalAttendancePage({
  data,
}: {
  data: MechanicPortalAttendancePageData;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    recordMechanicAttendanceLogAction,
    INITIAL_ATTENDANCE_ENTRY_ACTION_STATE,
  );
  const nextLogType = getMechanicPortalPrimaryLogType(data.attendance);
  const canPunch =
    Boolean(nextLogType) && data.ipStatus.isAllowed && data.deviceStatus.isApproved;

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    router.refresh();
  }, [router, state.status]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Mechanic portal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          Record your on-site time in and time out using the approved shop network.
        </p>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-5 p-5">
          <MechanicPortalClock />

          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Today&apos;s status
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {formatMechanicAttendanceState(data.attendance, data.todayAmendments)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.attendance?.approvedAt ? (
                  <StatusBadge tone="success">Approved</StatusBadge>
                ) : null}
                {data.todayAmendments
                  .filter((item) => item.status === "pending")
                  .map((item) => (
                    <StatusBadge key={item.id} tone="warning">
                      Pending amendment
                    </StatusBadge>
                  ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Time in
                </p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {formatAttendanceTime(data.attendance?.timeIn)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Time out
                </p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {formatAttendanceTime(data.attendance?.timeOut)}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border px-4 py-4 text-sm ${
              data.ipStatus.isAllowed
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <p className="font-medium">
              {formatMechanicIpStatusMessage(data.ipStatus, data.settings)}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-current/80">
              Detected IP: {data.ipStatus.requestIp ?? "Unavailable"}
            </p>
          </div>

          <div
            className={`rounded-2xl border px-4 py-4 text-sm ${
              data.deviceStatus.isApproved
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {formatMechanicDeviceStatusMessage(data.deviceStatus)}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-current/80">
                  Current device: {summarizeCurrentDevice(data.deviceStatus.currentDevice)}
                </p>
              </div>
              <StatusBadge
                tone={getStaffDeviceStatusTone(
                  data.deviceStatus.currentDevice?.status ?? "pending",
                )}
              >
                {data.deviceStatus.currentDevice
                  ? formatStaffDeviceStatusLabel(data.deviceStatus.currentDevice.status)
                  : data.deviceStatus.status === "registered_to_other_staff"
                    ? "Bound elsewhere"
                    : "Pending setup"}
              </StatusBadge>
            </div>
          </div>

          <form action={formAction} className="space-y-3">
            {nextLogType ? <input type="hidden" name="logType" value={nextLogType} /> : null}

            <SubmitButton
              pendingLabel="Saving..."
              disabled={!canPunch}
              className="h-14 w-full text-base"
            >
              {getMechanicPortalPrimaryActionLabel(data.attendance)}
            </SubmitButton>

            {!data.ipStatus.isAllowed || !data.deviceStatus.isApproved ? (
              <p className="text-center text-sm text-muted-foreground">
                Time in and time out stay blocked until both the approved shop network and an approved attendance device are present.
              </p>
            ) : null}

            <FormStatusMessage message={state.status === "error" ? state.message : undefined} />
          </form>

          {data.settings.allowDtrAmendments ? (
            <ModalDialog
              title="File DTR amendment"
              description="Use this if you missed a punch or were blocked by the wrong network."
              trigger={({ openDialog }) => (
                <Button type="button" variant="outline" className="w-full" onClick={openDialog}>
                  File DTR amendment
                </Button>
              )}
            >
              {({ closeDialog }) => (
                <DtrAmendmentForm
                  initialValues={buildDtrAmendmentFormValues(
                    data.todayDate,
                    nextLogType ?? "time_in",
                  )}
                  closeDialog={closeDialog}
                />
              )}
            </ModalDialog>
          ) : (
            <p className="text-sm text-muted-foreground">
              DTR amendments are currently disabled for this branch.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">
            Recent amendments
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pending and recently reviewed attendance requests for your account.
          </p>
        </CardHeader>
        <CardContent>
          {data.recentAmendments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No DTR amendments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentAmendments.map((amendment) => (
                <div
                  key={amendment.id}
                  className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {formatDate(amendment.attendanceDate)} · {formatDtrAmendmentTypeLabel(amendment.amendmentType)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requested for {formatDateTime(amendment.requestedTimestamp)}
                      </p>
                    </div>
                    <StatusBadge tone={getDtrAmendmentStatusTone(amendment.status)}>
                      {formatDtrAmendmentStatusLabel(amendment.status)}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-foreground">{amendment.reason}</p>
                  {amendment.adminNote?.trim() ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Admin note: {amendment.adminNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
