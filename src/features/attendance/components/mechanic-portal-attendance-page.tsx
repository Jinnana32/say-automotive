"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, ShieldCheck, Smartphone, TimerReset } from "lucide-react";

import { FormStatusMessage } from "@/components/shared/form-status";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { recordMechanicAttendanceLogAction } from "@/features/attendance/actions/mechanic-portal-actions";
import { DtrAmendmentForm } from "@/features/attendance/components/dtr-amendment-form";
import { summarizeCurrentDevice } from "@/features/attendance/device-utils";
import { MechanicPortalSectionIntro } from "@/features/attendance/components/mechanic-portal-section-intro";
import { MechanicPortalSlideAction } from "@/features/attendance/components/mechanic-portal-slide-action";
import { MechanicPortalVerificationCard } from "@/features/attendance/components/mechanic-portal-verification-card";
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

  const statusLabel = getMechanicAttendancePillLabel(data.attendance, data.todayAmendments);
  const statusTone = getMechanicAttendancePillTone(data.attendance, data.todayAmendments);
  const latestAction = getMechanicLatestActionSummary(data.attendance, data.todayAmendments);
  const networkSubtitle = getMechanicNetworkSummary(data);
  const deviceSubtitle = summarizeCurrentDevice(data.deviceStatus.currentDevice);
  const actionLabel = getMechanicPortalPrimaryActionLabel(data.attendance);

  return (
    <div className="space-y-4">
      <MechanicPortalSectionIntro
        eyebrow="Today"
        title="Attendance"
        description="Clock in and out using the approved shop network."
      />

      <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_24px_60px_rgba(8,23,53,0.06)]">
        <div className="flex items-start justify-between gap-4">
          <MechanicPortalClock
            timeFormat="hh:mm a"
            timeClassName="text-[2.1rem] font-semibold leading-none tracking-[-0.04em] text-slate-950"
            dateClassName="mt-2 text-sm text-slate-500"
          />
          <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-slate-200 bg-slate-50/75 px-4 py-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            <TimerReset className="size-4 text-[#D62828]" />
            Latest activity
          </div>
          <p className="mt-2 text-sm font-medium text-slate-900">{latestAction}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/65 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Time in
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {formatAttendanceTime(data.attendance?.timeIn)}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/65 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Time out
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {formatAttendanceTime(data.attendance?.timeOut)}
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <MechanicPortalVerificationCard
          icon={
            data.ipStatus.isAllowed ? (
              <ShieldCheck className="size-5" />
            ) : (
              <CircleAlert className="size-5" />
            )
          }
          title={
            data.ipStatus.isAllowed ? "Shop network verified" : "Approved shop network required"
          }
          subtitle={networkSubtitle}
          tone={data.ipStatus.isAllowed ? "success" : "warning"}
        />
        <MechanicPortalVerificationCard
          icon={
            data.deviceStatus.isApproved ? (
              <Smartphone className="size-5" />
            ) : (
              <CircleAlert className="size-5" />
            )
          }
          title={
            data.deviceStatus.isApproved ? "Approved device" : "Attendance device review required"
          }
          subtitle={deviceSubtitle}
          tone={data.deviceStatus.isApproved ? "success" : "warning"}
        />
      </div>

      <section className="space-y-3 rounded-[1.9rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_18px_45px_rgba(8,23,53,0.05)]">
        <form action={formAction} className="space-y-3">
          {nextLogType ? <input type="hidden" name="logType" value={nextLogType} /> : null}

          <MechanicPortalSlideAction pendingLabel="Saving..." disabled={!canPunch}>
            {nextLogType ? `Slide to ${actionLabel.toLowerCase()}` : actionLabel}
          </MechanicPortalSlideAction>

          {!data.ipStatus.isAllowed || !data.deviceStatus.isApproved ? (
            <p className="px-1 text-sm leading-6 text-slate-500">
              Time-in and time-out stay blocked until both the approved shop network and an approved attendance device are present.
            </p>
          ) : null}

          <FormStatusMessage message={state.status === "error" ? state.message : undefined} />
        </form>

        {data.settings.allowDtrAmendments ? (
          <ModalDialog
            title="File DTR amendment"
            description="Use this if you missed a punch or were blocked by the wrong network."
            trigger={({ openDialog }) => (
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-[1.2rem] border-[#0B1F4D]/20 text-sm font-semibold text-[#0B1F4D] hover:bg-[#EAF1FB]"
                onClick={openDialog}
              >
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
          <p className="px-1 text-sm text-slate-500">
            DTR amendments are currently disabled for this branch.
          </p>
        )}
      </section>

      <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(8,23,53,0.05)]">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950">Recent amendments</h2>
          <p className="text-sm text-slate-500">
            Pending and recently reviewed attendance requests.
          </p>
        </div>

        <div className="mt-4">
          {data.recentAmendments.length === 0 ? (
            <p className="text-sm text-slate-500">No DTR amendments yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentAmendments.map((amendment) => (
                <div
                  key={amendment.id}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50/70 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-950">
                        {formatDate(amendment.attendanceDate)} ·{" "}
                        {formatDtrAmendmentTypeLabel(amendment.amendmentType)}
                      </p>
                      <p className="text-sm text-slate-500">
                        Requested for {formatDateTime(amendment.requestedTimestamp)}
                      </p>
                    </div>
                    <StatusBadge tone={getDtrAmendmentStatusTone(amendment.status)}>
                      {formatDtrAmendmentStatusLabel(amendment.status)}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-slate-900">{amendment.reason}</p>
                  {amendment.adminNote?.trim() ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Admin note: {amendment.adminNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function getMechanicAttendancePillLabel(
  attendance: MechanicPortalAttendancePageData["attendance"],
  amendments: MechanicPortalAttendancePageData["todayAmendments"],
) {
  const pendingAmendment = amendments.find((item) => item.status === "pending");

  if (pendingAmendment) {
    return "PENDING";
  }

  if (!attendance?.timeIn) {
    return "READY";
  }

  if (attendance.timeIn && !attendance.timeOut) {
    return "TIMED IN";
  }

  return "TIMED OUT";
}

function getMechanicAttendancePillTone(
  attendance: MechanicPortalAttendancePageData["attendance"],
  amendments: MechanicPortalAttendancePageData["todayAmendments"],
) {
  if (amendments.some((item) => item.status === "pending")) {
    return "warning";
  }

  if (!attendance?.timeIn) {
    return "neutral";
  }

  return attendance.timeOut ? "info" : "success";
}

function getMechanicLatestActionSummary(
  attendance: MechanicPortalAttendancePageData["attendance"],
  amendments: MechanicPortalAttendancePageData["todayAmendments"],
) {
  if (amendments.some((item) => item.status === "pending")) {
    return "A DTR amendment is waiting for review.";
  }

  const summary = formatMechanicAttendanceState(attendance, amendments);

  if (summary === "Not timed in") {
    return "Waiting for your first punch today.";
  }

  return summary;
}

function getMechanicNetworkSummary(data: MechanicPortalAttendancePageData) {
  if (data.ipStatus.isAllowed) {
    const label = data.ipStatus.matchedAllowedIp?.label?.trim();
    const ip = data.ipStatus.requestIp;

    if (label && ip) {
      return `${label} • IP ${ip}`;
    }

    if (label) {
      return label;
    }

    if (ip) {
      return `Approved network • IP ${ip}`;
    }

    return "Approved shop network";
  }

  return data.ipStatus.requestIp
    ? `Current IP ${data.ipStatus.requestIp}`
    : formatMechanicIpStatusMessage(data.ipStatus, data.settings);
}
