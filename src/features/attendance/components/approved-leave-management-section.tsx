"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableCard } from "@/components/shared/data-table-card";
import { MetricGrid } from "@/components/shared/metric-grid";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StaffLeaveDialog } from "@/features/attendance/components/staff-leave-dialog";
import { StaffLeaveRowActions } from "@/features/attendance/components/staff-leave-row-actions";
import type { ApprovedLeaveManagementData } from "@/features/attendance/types";
import {
  formatLeaveDateRange,
  formatStaffLeaveTypeLabel,
  formatStaffRoleLabel,
  getInclusiveDayCount,
} from "@/features/attendance/utils";
import { getBusinessNow } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export function ApprovedLeaveManagementSection({
  data,
}: {
  data: ApprovedLeaveManagementData;
}) {
  const searchParams = useSearchParams();
  const today = getBusinessNow().toFormat("yyyy-LL-dd");
  const leaveSearch = searchParams.get("leaveSearch")?.trim().toLowerCase() ?? "";
  const leaveType = searchParams.get("leaveType") ?? "";
  const filteredLeaveEntries = useMemo(
    () =>
      data.leaveEntries.filter((leaveEntry) => {
        if (leaveType && leaveEntry.leaveType !== leaveType) {
          return false;
        }

        if (!leaveSearch) {
          return true;
        }

        return [
          leaveEntry.staffName,
          leaveEntry.staffRole ? formatStaffRoleLabel(leaveEntry.staffRole) : "",
          formatStaffLeaveTypeLabel(leaveEntry.leaveType),
          leaveEntry.notes ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(leaveSearch);
      }),
    [data.leaveEntries, leaveSearch, leaveType],
  );
  const leavePagination = paginateItems(
    filteredLeaveEntries,
    searchParams.get("leavePage") ?? undefined,
  );
  const activeTodayCount = data.leaveEntries.filter(
    (leaveEntry) => leaveEntry.startDate <= today && leaveEntry.endDate >= today,
  ).length;

  return (
    <div className="space-y-4">
      <MetricGrid className="xl:grid-cols-3">
        <StatCard
          title="Approved leave entries"
          value={String(data.leaveEntries.length)}
          description="Encoded leave windows available for payroll exclusion"
        />
        <StatCard
          title="Active today"
          value={String(activeTodayCount)}
          description="Leave windows covering the current date"
          tone={activeTodayCount > 0 ? "info" : "neutral"}
          badge={activeTodayCount > 0 ? "in effect" : "none today"}
        />
        <StatCard
          title="Active staff"
          value={String(data.activeStaff.length)}
          description="Selectable staff for leave encoding"
        />
      </MetricGrid>

      <DataTableCard
        title="Approved leave"
        description={`${leavePagination.totalItems} approved leave entr${
          leavePagination.totalItems === 1 ? "y" : "ies"
        } in the current view.`}
        action={<StaffLeaveDialog activeStaff={data.activeStaff} />}
        toolbar={
          <DataTableFilters
            key={`${leaveSearch}:${leaveType}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            pageParamName="leavePage"
            search={{
              name: "leaveSearch",
              value: searchParams.get("leaveSearch") ?? "",
              placeholder: "Search staff, leave type, or notes",
            }}
            filters={[
              {
                type: "select",
                name: "leaveType",
                value: leaveType,
                options: [
                  { value: "", label: "All leave types" },
                  { value: "vacation", label: "Vacation" },
                  { value: "sick", label: "Sick" },
                  { value: "emergency", label: "Emergency" },
                  { value: "unpaid", label: "Unpaid" },
                  { value: "other", label: "Other" },
                ],
              },
            ]}
          />
        }
        footer={
          <DataTablePagination
            page={leavePagination.page}
            pageSize={leavePagination.pageSize}
            totalItems={leavePagination.totalItems}
            totalPages={leavePagination.totalPages}
            startItem={leavePagination.startItem}
            endItem={leavePagination.endItem}
            pageParamName="leavePage"
          />
        }
      >
        {leavePagination.totalItems === 0 ? (
          <EmptyState
            title="No approved leave entries yet"
            description="Encode leave here once it is approved so attendance gaps and payroll blockers stay accurate."
            action={<StaffLeaveDialog activeStaff={data.activeStaff} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff member</TableHead>
                  <TableHead>Leave type</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leavePagination.items.map((leaveEntry) => (
                  <TableRow key={leaveEntry.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {leaveEntry.staffName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {leaveEntry.staffRole
                            ? formatStaffRoleLabel(leaveEntry.staffRole)
                            : "Unknown role"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone="warning">
                        {formatStaffLeaveTypeLabel(leaveEntry.leaveType)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLeaveDateRange(leaveEntry)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getInclusiveDayCount(leaveEntry.startDate, leaveEntry.endDate)}
                    </TableCell>
                    <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                      <span className="line-clamp-2">
                        {leaveEntry.notes?.trim() ? leaveEntry.notes : "No notes"}
                      </span>
                    </TableCell>
                    <TableCell className="w-14 text-right">
                      <StaffLeaveRowActions
                        leaveEntry={leaveEntry}
                        activeStaff={data.activeStaff}
                      />
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
