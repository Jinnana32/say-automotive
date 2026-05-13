import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { listStaff } from "@/features/staff/queries/staff-queries";

export const dynamic = "force-dynamic";

type StaffPageProps = {
  searchParams: Promise<{
    search?: string;
    role?: "owner" | "admin" | "mechanic" | "cashier" | "inventory_staff" | "service_advisor";
  }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const { search = "", role } = await searchParams;
  const staff = await listStaff({ search, role });

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

      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <form className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search by staff name or contact number"
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <select
              name="role"
              defaultValue={role ?? ""}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="mechanic">Mechanic</option>
              <option value="cashier">Cashier</option>
              <option value="inventory_staff">Inventory staff</option>
              <option value="service_advisor">Service advisor</option>
            </select>
            <Button type="submit">Apply filters</Button>
          </form>

          {staff.length === 0 ? (
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
            <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-semibold">{person.fullName}</TableCell>
                      <TableCell className="capitalize">{person.role.replace("_", " ")}</TableCell>
                      <TableCell>{person.contactNumber ?? "No contact number"}</TableCell>
                      <TableCell className="capitalize">{person.status}</TableCell>
                      <TableCell className="text-right">
                        <TableRowActionsMenu label={`Staff actions for ${person.fullName}`}>
                          <TableRowActionsMenuLink
                            href={`/staff/${person.id}/edit`}
                            label="Edit staff record"
                          />
                        </TableRowActionsMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
