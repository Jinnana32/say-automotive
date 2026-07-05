"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableScroll } from "@/components/shared/data-table-scroll";
import { FormStatusMessage } from "@/components/shared/form-status";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceAccessSettingsForm } from "@/features/attendance/components/attendance-access-settings-form";
import { AttendanceAllowedIpForm } from "@/features/attendance/components/attendance-allowed-ip-form";
import { AttendanceAllowedIpRowActions } from "@/features/attendance/components/attendance-allowed-ip-row-actions";
import { AttendanceDevicesPageContent } from "@/features/attendance/components/attendance-devices-page-content";
import { BranchHolidayDialog } from "@/features/attendance/components/branch-holiday-dialog";
import { PhilippineHolidayImportDialog } from "@/features/attendance/components/philippine-holiday-import-dialog";
import { BranchHolidayRowActions } from "@/features/attendance/components/branch-holiday-row-actions";
import type { BranchHolidaySummary, TimekeepingCalendarPageData } from "@/features/attendance/types";
import {
  formatBranchHolidayKindLabel,
  formatBranchHolidayPayTreatmentLabel,
} from "@/features/attendance/utils";
import { formatDate, getBusinessNow } from "@/lib/dates";

export function TimekeepingCalendarPageContent({
  data,
}: {
  data: TimekeepingCalendarPageData;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getBusinessNow().toFormat("yyyy-LL-dd");
  const upcomingHolidayCount = data.holidays.filter(
    (holiday) => holiday.holidayDate >= today,
  ).length;
  const activeTab = (() => {
    const tab = searchParams.get("tab");

    if (tab === "devices" || tab === "holidays") {
      return tab;
    }

    return "access";
  })();
  const feedbackError = searchParams.get("error");

  function updateTab(nextTab: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "access") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }

    params.delete("error");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timekeeping"
        description="Manage branch attendance rules, device approvals, and branch closure or holiday calendars from one place."
      />

      <FormStatusMessage message={feedbackError ?? undefined} />

      <MetricGrid className="xl:grid-cols-4">
        <StatCard
          title="Branch"
          value={data.branchName}
          description="Current calendar scope for attendance and payroll"
        />
        <StatCard
          title="Calendar dates"
          value={String(data.holidays.length)}
          description="Configured branch closures and holiday exceptions"
          badge={`${upcomingHolidayCount} upcoming`}
          tone={upcomingHolidayCount > 0 ? "info" : "neutral"}
        />
        <StatCard
          title="Pending amendments"
          value={String(data.pendingAmendmentCount)}
          description="Requests waiting for attendance review and payroll readiness"
          tone={data.pendingAmendmentCount > 0 ? "info" : "neutral"}
        />
        <StatCard
          title="Pending devices"
          value={String(data.pendingDeviceCount)}
          description="New mechanic phones and browsers waiting for approval"
          tone={data.pendingDeviceCount > 0 ? "warning" : "neutral"}
        />
      </MetricGrid>

      <Tabs
        defaultValue="access"
        value={activeTab}
        onValueChange={updateTab}
        className="min-w-0 space-y-6"
      >
        <TabsList className="w-full max-w-full flex-wrap xl:w-fit">
          <TabsTrigger value="access">Access & IP</TabsTrigger>
          <TabsTrigger value="devices">
            Review devices
            {data.pendingDeviceCount > 0 ? ` (${data.pendingDeviceCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="holidays">Branch holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold text-foreground">
                Mechanic portal access
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enable shop IP and/or shop location verification for mechanic punches.
                At least one on-site check must stay enabled.
              </p>
            </CardHeader>
            <CardContent>
              <AttendanceAccessSettingsForm
                initialValues={data.attendanceAccessSettings}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-semibold text-foreground">
                  Approved shop IPs
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Used when shop IP verification is enabled. Attendance punches are treated
                  as on-site only when the current public internet IP matches one of these
                  branch addresses.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Detected public IP
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {data.currentDetectedIp ?? "Unable to detect"}
                    </p>
                    {data.currentDetectedIp ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Use this to register the current branch connection after
                        confirming you are on-site.
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Public IP could not be detected on this request.
                        {data.observedRequestIp
                          ? ` Observed request IP: ${data.observedRequestIp}.`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Pending amendments
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {data.pendingAmendmentCount}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Requests waiting for attendance review and payroll readiness.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Pending devices
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {data.pendingDeviceCount}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      New mechanic phones and browsers waiting for approval.
                    </p>
                  </div>
                </div>

                <AttendanceAllowedIpForm
                  currentDetectedIp={data.currentDetectedIp}
                />

                {data.allowedIpAddresses.length === 0 ? (
                  <EmptyState
                    title="No allowed shop IPs yet"
                    description="Mechanic punches will fail network validation until at least one approved branch IP is added."
                  />
                ) : (
                  <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP address</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.allowedIpAddresses.map((allowedIp) => (
                          <TableRow key={allowedIp.id}>
                            <TableCell className="font-medium text-foreground">
                              {allowedIp.ipAddress}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {allowedIp.label?.trim() || "No label"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(allowedIp.updatedAt)}
                            </TableCell>
                            <TableCell className="w-14 text-right">
                              <AttendanceAllowedIpRowActions
                                allowedIp={allowedIp}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <AttendanceDevicesPageContent
            data={data.devicesReview}
            embedded
            paramPrefix="device"
          />
        </TabsContent>

        <TabsContent value="holidays" className="space-y-6">
          <DataTableCard
            title="Branch calendar dates"
            description="These dates remove expected attendance for the whole branch and record how payroll should treat the day."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <PhilippineHolidayImportDialog existingHolidays={data.holidays} />
                <BranchHolidayDialog triggerLabel="Add calendar date" />
              </div>
            }
          >
            {data.holidays.length === 0 ? (
              <EmptyState
                title="No branch calendar dates yet"
                description="Add branch closures or holidays so attendance is not expected and payroll treatment is explicit."
                action={
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <PhilippineHolidayImportDialog existingHolidays={data.holidays} />
                    <BranchHolidayDialog triggerLabel="Add calendar date" />
                  </div>
                }
              />
            ) : (
              <DataTableScroll>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Event type</TableHead>
                      <TableHead>Pay treatment</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.holidays.map((holiday) => (
                      <TableRow key={holiday.id}>
                        <TableCell className="font-medium text-foreground">
                          {formatDate(holiday.holidayDate)}
                        </TableCell>
                        <TableCell>{holiday.label}</TableCell>
                        <TableCell>
                          <StatusBadge tone="neutral" className={getBranchHolidayTypeBadgeClass(holiday)}>
                            {formatBranchHolidayKindLabel(holiday.holidayKind)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            tone="neutral"
                            className={getBranchHolidayPayTreatmentBadgeClass(holiday)}
                          >
                            {formatBranchHolidayPayTreatmentLabel(holiday.payTreatment)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                          <span className="line-clamp-2">
                            {holiday.notes?.trim() ? holiday.notes : "No notes"}
                          </span>
                        </TableCell>
                        <TableCell className="w-14 text-right">
                          <BranchHolidayRowActions holiday={holiday} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
          </DataTableScroll>
            )}
          </DataTableCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getBranchHolidayTypeBadgeClass(holiday: BranchHolidaySummary) {
  switch (holiday.holidayKind) {
    case "branch_closure":
      return "border-transparent bg-sky-100 text-sky-800";
    case "public_holiday":
    case "company_holiday":
      return "border-transparent bg-violet-100 text-violet-800";
    case "special_non_working_day":
      return "border-transparent bg-amber-100 text-amber-800";
  }
}

function getBranchHolidayPayTreatmentBadgeClass(holiday: BranchHolidaySummary) {
  switch (holiday.payTreatment) {
    case "unpaid":
      return "border-transparent bg-slate-100 text-slate-700";
    case "paid_regular_day":
      return "border-transparent bg-emerald-100 text-emerald-800";
    case "custom":
      return "border-transparent bg-amber-100 text-amber-800";
  }
}
