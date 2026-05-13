"use client";

import { ModalDialog } from "@/components/shared/modal-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DtrAmendmentForm } from "@/features/attendance/components/dtr-amendment-form";
import {
  formatMechanicDeviceStatusMessage,
  formatStaffDeviceStatusLabel,
  getStaffDeviceStatusTone,
  summarizeCurrentDevice,
} from "@/features/attendance/device-utils";
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
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Mechanic portal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          DTR amendments
        </h1>
        <p className="text-sm text-muted-foreground">
          Review the status of your attendance corrections and submit a new one when needed.
        </p>
      </div>

      {data.settings.allowDtrAmendments ? (
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            {!data.deviceStatus.isApproved ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
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
            ) : null}

            <ModalDialog
              title="File DTR amendment"
              description="Use this when you missed a punch or need an admin-approved correction."
              trigger={({ openDialog }) => (
                <Button type="button" className="w-full" onClick={openDialog}>
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
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5 text-sm text-muted-foreground">
            DTR amendments are currently disabled for this branch.
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">
            Amendment history
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Newest requests appear first, including admin approval or rejection notes.
          </p>
        </CardHeader>
        <CardContent>
          {data.amendments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No DTR amendments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.amendments.map((amendment) => (
                <div
                  key={amendment.id}
                  className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {formatDate(amendment.attendanceDate)} ·{" "}
                        {formatAttendanceLogTypeLabel(amendment.targetLogType)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDtrAmendmentTypeLabel(amendment.amendmentType)}
                      </p>
                    </div>
                    <StatusBadge tone={getDtrAmendmentStatusTone(amendment.status)}>
                      {formatDtrAmendmentStatusLabel(amendment.status)}
                    </StatusBadge>
                  </div>

                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Requested time: {formatDateTime(amendment.requestedTimestamp)}
                    </p>
                    {amendment.finalTimestamp ? (
                      <p className="text-muted-foreground">
                        Final approved time: {formatDateTime(amendment.finalTimestamp)}
                      </p>
                    ) : null}
                    <p className="text-foreground">{amendment.reason}</p>
                    {amendment.adminNote?.trim() ? (
                      <p className="text-muted-foreground">
                        Admin note: {amendment.adminNote}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
