"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  LogIn,
  LogOut,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";

import { FormStatusMessage } from "@/components/shared/form-status";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { recordMechanicAttendanceLogAction } from "@/features/attendance/actions/mechanic-portal-actions";
import { DtrAmendmentForm } from "@/features/attendance/components/dtr-amendment-form";
import { MechanicPortalClock } from "@/features/attendance/components/mechanic-portal-clock";
import { MechanicPortalSlideAction } from "@/features/attendance/components/mechanic-portal-slide-action";
import { MechanicPortalVerificationCard } from "@/features/attendance/components/mechanic-portal-verification-card";
import { summarizeCurrentDevice } from "@/features/attendance/device-utils";
import type { MechanicPortalAttendancePageData } from "@/features/attendance/types";
import {
  buildDtrAmendmentFormValues,
  formatAttendanceTime,
  formatDtrAmendmentStatusLabel,
  formatDtrAmendmentTypeLabel,
  formatMechanicIpStatusMessage,
  getDtrAmendmentStatusTone,
  getMechanicPortalPrimaryActionLabel,
  getMechanicPortalPrimaryLogType,
  INITIAL_ATTENDANCE_ENTRY_ACTION_STATE,
} from "@/features/attendance/utils";
import { formatDate, formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

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
  const statusCopy = getAttendanceStatusCopy(data.attendance, data.todayAmendments);
  const networkSubtitle = getMechanicNetworkSummary(data);
  const deviceSubtitle = summarizeCurrentDevice(data.deviceStatus.currentDevice);
  const actionLabel = getMechanicPortalPrimaryActionLabel(data.attendance);
  const visibleRecentRequests = data.recentAmendments.slice(0, 3);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    router.refresh();
  }, [router, state.status]);

  return (
    <div className="space-y-4">
      <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_22px_50px_rgba(8,23,53,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#D62828]">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <h1 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-950">
                Today&apos;s Attendance
              </h1>
            </div>
          </div>
          <StatusBadge
            tone={statusCopy.tone}
            className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            {statusCopy.label}
          </StatusBadge>
        </div>

        <div className="mt-5 text-center">
          <MechanicPortalClock
            timeFormat="hh:mm a"
            timeClassName="text-[3.35rem] font-semibold leading-none tracking-[-0.08em] text-[#081735]"
            dateClassName="mt-2 text-[1.05rem] text-slate-500"
          />
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3.5">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                statusCopy.iconTone === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : statusCopy.iconTone === "warning"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-100 text-slate-500",
              )}
            >
              {statusCopy.iconTone === "success" ? (
                <CheckCircle2 className="size-5" />
              ) : statusCopy.iconTone === "warning" ? (
                <CircleAlert className="size-5" />
              ) : (
                <Clock3 className="size-5" />
              )}
            </span>
            <p>{statusCopy.message}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <AttendanceTimeCard
            label="Time In"
            value={formatAttendanceTime(data.attendance?.timeIn)}
            icon={<LogIn className="size-4" />}
            tone="info"
          />
          <AttendanceTimeCard
            label="Time Out"
            value={formatAttendanceTime(data.attendance?.timeOut)}
            icon={<LogOut className="size-4" />}
            tone="danger"
          />
        </div>

        <div className="mt-5">
          <form action={formAction} className="space-y-3">
            {nextLogType ? <input type="hidden" name="logType" value={nextLogType} /> : null}

            <MechanicPortalSlideAction pendingLabel="Saving..." disabled={!canPunch}>
              {nextLogType ? `Slide to ${actionLabel}` : actionLabel}
            </MechanicPortalSlideAction>

            {!data.ipStatus.isAllowed || !data.deviceStatus.isApproved ? (
              <p className="px-1 text-sm leading-6 text-slate-500">
                Time-in and time-out stay blocked until both the approved shop network and approved device are verified.
              </p>
            ) : null}

            <FormStatusMessage message={state.status === "error" ? state.message : undefined} />
          </form>
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(8,23,53,0.05)]">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950">Verification Status</h2>
        </div>
        <div className="mt-4 space-y-3">
          <MechanicPortalVerificationCard
            icon={
              data.ipStatus.isAllowed ? (
                <ShieldCheck className="size-5" />
              ) : (
                <CircleAlert className="size-5" />
              )
            }
            title={
              data.ipStatus.isAllowed ? "Shop network verified" : "Shop network needs review"
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
            title={data.deviceStatus.isApproved ? "Approved device" : "Device needs approval"}
            subtitle={deviceSubtitle}
            tone={data.deviceStatus.isApproved ? "success" : "warning"}
          />
        </div>
      </section>

      <section className="rounded-[1.55rem] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_14px_35px_rgba(8,23,53,0.05)]">
        {data.settings.allowDtrAmendments ? (
          <ModalDialog
            title="Request Time Correction"
            description="Use this if you missed a punch or need an attendance correction for today."
            trigger={({ openDialog }) => (
              <button
                type="button"
                onClick={openDialog}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#081735]">
                  <WalletCards className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-[#081735]">
                    Request Time Correction
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-slate-400" />
              </button>
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
          <p className="text-sm text-slate-500">
            Time correction requests are currently disabled for this branch.
          </p>
        )}
      </section>

      <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(8,23,53,0.05)]">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950">Recent Requests</h2>
        </div>

        <div className="mt-4">
          {visibleRecentRequests.length === 0 ? (
            <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50/70 px-4 py-4 text-slate-500">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[#8AA0D6] shadow-sm">
                <WalletCards className="size-5" />
              </span>
              <p className="text-sm">No correction requests yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleRecentRequests.map((amendment) => (
                <div
                  key={amendment.id}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">
                        {formatDate(amendment.attendanceDate)} -{" "}
                        {formatDtrAmendmentTypeLabel(amendment.amendmentType)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Requested {formatDateTime(amendment.requestedTimestamp)}
                      </p>
                    </div>
                    <StatusBadge tone={getDtrAmendmentStatusTone(amendment.status)}>
                      {formatDtrAmendmentStatusLabel(amendment.status)}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-slate-900">{amendment.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AttendanceTimeCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "info" | "danger";
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            tone === "info"
              ? "bg-[#EEF3FF] text-[#2458FF]"
              : "bg-[#FFF1F0] text-[#D62828]",
          )}
        >
          {icon}
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.02em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

function getAttendanceStatusCopy(
  attendance: MechanicPortalAttendancePageData["attendance"],
  amendments: MechanicPortalAttendancePageData["todayAmendments"],
) {
  if (amendments.some((item) => item.status === "pending")) {
    return {
      label: "Incomplete",
      tone: "warning" as const,
      iconTone: "warning" as const,
      message: "Today's attendance needs review.",
    };
  }

  if (!attendance?.timeIn) {
    return {
      label: "Not Timed In",
      tone: "neutral" as const,
      iconTone: "neutral" as const,
      message: "You are not timed in yet.",
    };
  }

  if (attendance.timeIn && !attendance.timeOut) {
    return {
      label: "Timed In",
      tone: "success" as const,
      iconTone: "success" as const,
      message: "You are currently timed in.",
    };
  }

  return {
    label: "Timed Out",
    tone: "info" as const,
    iconTone: "success" as const,
    message: "You have timed out for today.",
  };
}

function getMechanicNetworkSummary(data: MechanicPortalAttendancePageData) {
  if (data.ipStatus.isAllowed) {
    const label = data.ipStatus.matchedAllowedIp?.label?.trim();
    const ip = data.ipStatus.requestIp;

    if (label && ip) {
      return `${label} - IP ${ip}`;
    }

    if (label) {
      return label;
    }

    if (ip) {
      return `Approved network - IP ${ip}`;
    }

    return "Approved shop network";
  }

  return data.ipStatus.requestIp
    ? `Current IP ${data.ipStatus.requestIp}`
    : formatMechanicIpStatusMessage(data.ipStatus, data.settings);
}
