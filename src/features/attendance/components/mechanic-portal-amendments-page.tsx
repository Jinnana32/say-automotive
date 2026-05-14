"use client";

import { CircleAlert, PencilLine } from "lucide-react";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { DtrAmendmentForm } from "@/features/attendance/components/dtr-amendment-form";
import { formatMechanicDeviceStatusMessage, summarizeCurrentDevice } from "@/features/attendance/device-utils";
import { MechanicPortalSectionIntro } from "@/features/attendance/components/mechanic-portal-section-intro";
import { MechanicPortalVerificationCard } from "@/features/attendance/components/mechanic-portal-verification-card";
import type { MechanicPortalAmendmentsPageData } from "@/features/attendance/types";
import {
  buildDtrAmendmentFormValues,
  formatAttendanceLogTypeLabel,
  formatDtrAmendmentStatusLabel,
  formatDtrAmendmentTypeLabel,
  getDtrAmendmentStatusTone,
} from "@/features/attendance/utils";
import { formatDate, formatDateTime } from "@/lib/dates";

export function MechanicPortalAmendmentsPage({
  data,
}: {
  data: MechanicPortalAmendmentsPageData;
}) {
  return (
    <div className="space-y-4">
      <MechanicPortalSectionIntro
        eyebrow="History"
        title="DTR amendments"
        description="Review the status of your attendance corrections and submit a new one when needed."
      />

      {data.settings.allowDtrAmendments ? (
        <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_18px_45px_rgba(8,23,53,0.05)]">
          {!data.deviceStatus.isApproved ? (
            <div className="mb-3">
              <MechanicPortalVerificationCard
                icon={<CircleAlert className="size-5" />}
                title={formatMechanicDeviceStatusMessage(data.deviceStatus)}
                subtitle={summarizeCurrentDevice(data.deviceStatus.currentDevice)}
                tone="warning"
              />
            </div>
          ) : null}

          <ModalDialog
            title="File DTR amendment"
            description="Use this when you missed a punch or need an admin-approved correction."
            trigger={({ openDialog }) => (
              <Button
                type="button"
                className="h-12 w-full rounded-[1.2rem] bg-[#081735] text-sm font-semibold text-white hover:bg-[#0B1F4D]"
                onClick={openDialog}
              >
                <PencilLine className="mr-2 size-4" />
                New DTR amendment
              </Button>
            )}
          >
            {({ closeDialog }) => (
              <DtrAmendmentForm
                initialValues={buildDtrAmendmentFormValues(data.todayDate)}
                closeDialog={closeDialog}
              />
            )}
          </ModalDialog>
        </section>
      ) : (
        <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-5 py-5 text-sm text-slate-500 shadow-[0_18px_45px_rgba(8,23,53,0.05)]">
          DTR amendments are currently disabled for this branch.
        </section>
      )}

      <section className="rounded-[1.9rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(8,23,53,0.05)]">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950">Recent amendments</h2>
          <p className="text-sm text-slate-500">
            Pending and recently reviewed attendance requests.
          </p>
        </div>

        <div className="mt-4">
          {data.amendments.length === 0 ? (
            <p className="text-sm text-slate-500">No DTR amendments yet.</p>
          ) : (
            <div className="space-y-3">
              {data.amendments.map((amendment) => (
                <div
                  key={amendment.id}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50/70 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-950">
                        {formatDate(amendment.attendanceDate)} ·{" "}
                        {formatAttendanceLogTypeLabel(amendment.targetLogType)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDtrAmendmentTypeLabel(amendment.amendmentType)}
                      </p>
                    </div>
                    <StatusBadge tone={getDtrAmendmentStatusTone(amendment.status)}>
                      {formatDtrAmendmentStatusLabel(amendment.status)}
                    </StatusBadge>
                  </div>

                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-slate-500">
                      Requested time: {formatDateTime(amendment.requestedTimestamp)}
                    </p>
                    {amendment.finalTimestamp ? (
                      <p className="text-slate-500">
                        Final approved time: {formatDateTime(amendment.finalTimestamp)}
                      </p>
                    ) : null}
                    <p className="text-slate-900">{amendment.reason}</p>
                    {amendment.adminNote?.trim() ? (
                      <p className="text-slate-500">Admin note: {amendment.adminNote}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
