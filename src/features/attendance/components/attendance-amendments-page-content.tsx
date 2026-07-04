"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceAmendmentRowActions } from "@/features/attendance/components/attendance-amendment-row-actions";
import type { AttendanceAmendmentsPageData } from "@/features/attendance/types";
import {
  formatAttendanceLogTypeLabel,
  formatDtrAmendmentStatusLabel,
  formatDtrAmendmentTypeLabel,
  formatStaffRoleLabel,
  getDtrAmendmentStatusTone,
} from "@/features/attendance/utils";
import { formatDate, formatDateTime } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export function AttendanceAmendmentsPageContent({
  data,
  embedded = false,
  paramPrefix = "amendment",
}: {
  data: AttendanceAmendmentsPageData;
  embedded?: boolean;
  paramPrefix?: string;
}) {
  const searchParams = useSearchParams();
  const searchParamName = embedded ? `${paramPrefix}Search` : "search";
  const statusParamName = embedded ? `${paramPrefix}Status` : "status";
  const pageParamName = embedded ? `${paramPrefix}Page` : "page";
  const search = searchParams.get(searchParamName)?.trim().toLowerCase() ?? "";
  const status = searchParams.get(statusParamName) ?? "";
  const filteredAmendments = useMemo(
    () =>
      data.amendments.filter((amendment) => {
        if (status && amendment.status !== status) {
          return false;
        }

        if (!search) {
          return true;
        }

        return [
          amendment.staffName,
          formatStaffRoleLabel(amendment.staffRole),
          amendment.reason,
          amendment.requestedIp ?? "",
          formatAttendanceLogTypeLabel(amendment.targetLogType),
          formatDtrAmendmentTypeLabel(amendment.amendmentType),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      }),
    [data.amendments, search, status],
  );
  const pagination = paginateItems(filteredAmendments, searchParams.get(pageParamName) ?? undefined);

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      {embedded ? null : (
        <PageHeader
          title="DTR Amendments"
          description="Review blocked punches, missed time entries, and final attendance corrections before payroll relies on the record."
          actions={
            <Button asChild variant="outline">
              <Link href="/settings/timekeeping">Timekeeping settings</Link>
            </Button>
          }
        />
      )}

      <MetricGrid className="xl:grid-cols-3">
        <StatCard
          title="Pending review"
          value={String(data.pendingCount)}
          description="Requests that still need owner or admin action"
          tone={data.pendingCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          title="Total requests"
          value={String(data.totalCount)}
          description="Amendments currently stored in the branch review queue"
        />
        <StatCard
          title="Weekly physical DTR proof"
          value="Manual"
          description="Weekly DTR photo review remains outside the app for this MVP."
        />
      </MetricGrid>

      <DataTableCard
        title="Amendment review queue"
        description={`${pagination.totalItems} amendment request${
          pagination.totalItems === 1 ? "" : "s"
        } in the current view.`}
        className="min-w-0"
        contentClassName="p-0"
        toolbar={
          <DataTableFilters
            key={`${search}:${status}`}
            className="xl:grid xl:grid-cols-[minmax(0,1fr)_220px]"
            search={{
              name: searchParamName,
              value: searchParams.get(searchParamName) ?? "",
              placeholder: "Search staff, reason, IP, or amendment type",
            }}
            pageParamName={pageParamName}
            filters={[
              {
                type: "select",
                name: statusParamName,
                value: status,
                options: [
                  { value: "", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ],
              },
            ]}
          />
        }
        footer={
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            pageParamName={pageParamName}
          />
        }
      >
        {pagination.totalItems === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No DTR amendments yet"
              description="Mechanic amendment requests will appear here once someone submits a missed punch or wrong-network correction."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff member</TableHead>
                  <TableHead>Requested record</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Request IP</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((amendment) => (
                  <TableRow key={amendment.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{amendment.staffName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatStaffRoleLabel(amendment.staffRole)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="space-y-1">
                      <p className="font-medium text-foreground">
                        {formatDate(amendment.attendanceDate)} · {formatAttendanceLogTypeLabel(amendment.targetLogType)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDtrAmendmentTypeLabel(amendment.amendmentType)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requested {formatDateTime(amendment.requestedTimestamp)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <StatusBadge tone={getDtrAmendmentStatusTone(amendment.status)}>
                          {formatDtrAmendmentStatusLabel(amendment.status)}
                        </StatusBadge>
                        {amendment.finalTimestamp ? (
                          <p className="text-xs text-muted-foreground">
                            Final: {formatDateTime(amendment.finalTimestamp)}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(amendment.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[360px] text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p className="line-clamp-3">{amendment.reason}</p>
                        {amendment.adminNote?.trim() ? (
                          <p className="line-clamp-2 text-xs">
                            Admin note: {amendment.adminNote}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {amendment.requestedIp ?? "Unavailable"}
                    </TableCell>
                    <TableCell className="w-24 text-right">
                      <AttendanceAmendmentRowActions amendment={amendment} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableCard>
    </div>
  );
}
