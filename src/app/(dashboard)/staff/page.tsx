import Link from "next/link";
import { Pencil } from "lucide-react";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableScroll } from "@/components/shared/data-table-scroll";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { IconActionLink } from "@/components/shared/icon-action";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listStaff } from "@/features/staff/queries/staff-queries";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type StaffPageProps = {
  searchParams: Promise<{
    search?: string;
    role?: "owner" | "admin" | "mechanic" | "cashier" | "inventory_staff" | "service_advisor";
    page?: string;
  }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const { search = "", role = "", page } = await searchParams;
  const staff = await listStaff({ search, role: role || undefined });
  const pagination = paginateItems(staff, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Maintain workshop personnel records before attendance, mechanic assignment, and productivity workflows are layered on top."
        actions={
          <Button asChild>
            <Link href="/staff/new">New staff record</Link>
          </Button>
        }
      />

      <DataTableCard
        title="Staff roster"
        description={`${pagination.totalItems} staff record${pagination.totalItems === 1 ? "" : "s"} in the current view.`}
        toolbar={
          <DataTableFilters
            key={`${search}:${role}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            search={{
              value: search,
              placeholder: "Search by staff name or contact number",
            }}
            filters={[
              {
                type: "select",
                name: "role",
                value: role,
                options: [
                  { value: "", label: "All roles" },
                  { value: "owner", label: "Owner" },
                  { value: "admin", label: "Admin" },
                  { value: "mechanic", label: "Mechanic" },
                  { value: "cashier", label: "Cashier" },
                  { value: "inventory_staff", label: "Inventory staff" },
                  { value: "service_advisor", label: "Service advisor" },
                ],
              },
            ]}
          />
        }
        contentClassName="p-0"
        footer={
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
          />
        }
      >
          {pagination.totalItems === 0 ? (
            <EmptyState
              title="No staff records found"
              description="Create staff records now so attendance and mechanic assignment can be added on a stable base."
              action={
                <Button asChild>
                  <Link href="/staff/new">Create staff record</Link>
                </Button>
              }
            />
          ) : (
            <DataTableScroll>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.items.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-mono text-xs font-semibold tracking-[0.16em] text-slate-600">
                        {person.staffCode ?? "Pending"}
                      </TableCell>
                      <TableCell className="font-semibold">{person.fullName}</TableCell>
                      <TableCell className="capitalize">{person.role.replace("_", " ")}</TableCell>
                      <TableCell>{person.contactNumber ?? "No contact number"}</TableCell>
                      <TableCell className="capitalize">{person.status}</TableCell>
                      <TableCell className="w-14 text-right">
                        <IconActionLink
                          href={`/staff/${person.id}/edit`}
                          label={`Edit staff record for ${person.fullName}`}
                          icon={Pencil}
                        />
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
