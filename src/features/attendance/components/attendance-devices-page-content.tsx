"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableScroll } from "@/components/shared/data-table-scroll";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceDeviceRowActions } from "@/features/attendance/components/attendance-device-row-actions";
import {
  formatStaffDeviceStatusLabel,
  getStaffDeviceStatusTone,
} from "@/features/attendance/device-utils";
import type { AttendanceDevicesPageData } from "@/features/attendance/types";
import { formatStaffRoleLabel } from "@/features/attendance/utils";
import { formatDateTime } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export function AttendanceDevicesPageContent({
  data,
  embedded = false,
  paramPrefix = "device",
}: {
  data: AttendanceDevicesPageData;
  embedded?: boolean;
  paramPrefix?: string;
}) {
  const searchParams = useSearchParams();
  const searchParamName = embedded ? `${paramPrefix}Search` : "search";
  const statusParamName = embedded ? `${paramPrefix}Status` : "status";
  const pageParamName = embedded ? `${paramPrefix}Page` : "page";
  const search = searchParams.get(searchParamName)?.trim().toLowerCase() ?? "";
  const status = searchParams.get(statusParamName) ?? "";
  const filteredDevices = useMemo(
    () =>
      data.devices.filter((device) => {
        if (status && device.status !== status) {
          return false;
        }

        if (!search) {
          return true;
        }

        return [
          device.staffName,
          formatStaffRoleLabel(device.staffRole),
          device.deviceName ?? "",
          device.userAgent ?? "",
          device.lastIp ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      }),
    [data.devices, search, status],
  );
  const pagination = paginateItems(filteredDevices, searchParams.get(pageParamName) ?? undefined);

  return (
    <div className="space-y-6">
      {embedded ? null : (
        <PageHeader
          title="Attendance Devices"
          description="Approve or revoke the phones and browsers mechanics are allowed to use for on-site time-in and time-out."
          actions={
            <Button asChild variant="outline">
              <Link href="/settings/timekeeping">Timekeeping settings</Link>
            </Button>
          }
        />
      )}

      <MetricGrid className="xl:grid-cols-3">
        <StatCard
          title="Pending approval"
          value={String(data.pendingCount)}
          description="New devices that are blocked from time-in/time-out until reviewed"
          tone={data.pendingCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          title="Approved devices"
          value={String(data.approvedCount)}
          description="Mechanic devices currently allowed for attendance punches"
        />
        <StatCard
          title="Revoked devices"
          value={String(data.revokedCount)}
          description="Previously known devices that are no longer allowed to punch"
        />
      </MetricGrid>

      <DataTableCard
        contentClassName="p-0"
        toolbar={
          <DataTableFilters
            key={`${search}:${status}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            search={{
              name: searchParamName,
              value: searchParams.get(searchParamName) ?? "",
              placeholder: "Search mechanic, device, browser, or IP",
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
                  { value: "revoked", label: "Revoked" },
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
              title="No mechanic devices registered yet"
              description="A device record is created automatically when a mechanic opens the portal with a new browser or phone."
            />
          </div>
        ) : (
          <DataTableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mechanic</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>First seen</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Last IP</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{device.staffName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatStaffRoleLabel(device.staffRole)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="space-y-1">
                      <p className="font-medium text-foreground">
                        {device.deviceName?.trim() || "Unnamed device"}
                      </p>
                      <p className="max-w-[360px] line-clamp-2 text-sm text-muted-foreground">
                        {device.userAgent ?? "Unknown browser"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <StatusBadge tone={getStaffDeviceStatusTone(device.status)}>
                          {formatStaffDeviceStatusLabel(device.status)}
                        </StatusBadge>
                        {device.approvedAt ? (
                          <p className="text-xs text-muted-foreground">
                            Approved {formatDateTime(device.approvedAt)}
                          </p>
                        ) : null}
                        {device.revokedAt ? (
                          <p className="text-xs text-muted-foreground">
                            Revoked {formatDateTime(device.revokedAt)}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(device.firstSeenAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(device.lastSeenAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.lastIp ?? "Unavailable"}
                    </TableCell>
                    <TableCell className="w-14 text-right">
                      <AttendanceDeviceRowActions device={device} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableScroll>
        )}
      </DataTableCard>
    </div>
  );
}
