import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { TableRowActionsMenu, TableRowActionsMenuLink } from "@/components/shared/table-row-actions-menu";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentMethodBadge } from "@/features/invoices/components/invoice-status-badge";
import { listPayments } from "@/features/invoices/queries/invoice-queries";
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod } from "@/features/invoices/types";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type PaymentsPageProps = {
  searchParams: Promise<{
    search?: string;
    paymentMethod?: PaymentMethod | "";
    page?: string;
  }>;
};

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const { search = "", paymentMethod = "", page } = await searchParams;
  const payments = await listPayments({ search, paymentMethod });
  const pagination = paginateItems(payments, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Collections are recorded against invoices and update balances and downstream release eligibility."
        actions={
          <Button asChild variant="outline">
            <Link href="/invoices">Review invoices</Link>
          </Button>
        }
      />

      <DataTableCard
        title="Payment ledger"
        description={`${pagination.totalItems} payment${pagination.totalItems === 1 ? "" : "s"} in the current view.`}
        toolbar={
          <DataTableFilters
            key={`${search}:${paymentMethod}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px]"
            search={{
              value: search,
              placeholder: "Search by invoice or customer",
            }}
            filters={[
              {
                type: "select",
                name: "paymentMethod",
                value: paymentMethod,
                options: [
                  { value: "", label: "All methods" },
                  ...PAYMENT_METHOD_OPTIONS,
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
              title="No payments found"
              description="Payments will appear here once invoices start getting settled."
              action={
                <Button asChild>
                  <Link href="/invoices">Go to invoices</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paid at</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Job order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.items.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <TableCellLink href={`/payments/${payment.id}`} className="text-foreground">
                          {formatDateTime(payment.paidAt)}
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink href={`/payments/${payment.id}`} className="font-semibold text-foreground">
                          {payment.invoiceNumber}
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink href={`/payments/${payment.id}`} className="text-foreground">
                          {payment.jobOrderNumber ?? "POS flow"}
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink href={`/payments/${payment.id}`} className="text-foreground">
                          {payment.customerName}
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink href={`/payments/${payment.id}`}>
                          <PaymentMethodBadge method={payment.paymentMethod} />
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink href={`/payments/${payment.id}`} className="text-foreground">
                          {formatCurrency(payment.amount)}
                        </TableCellLink>
                      </TableCell>
                      <TableCell>
                        <TableCellLink href={`/payments/${payment.id}`} className="text-foreground">
                          {payment.referenceNumber ?? "No reference"}
                        </TableCellLink>
                      </TableCell>
                      <TableCell className="w-14 text-right">
                        <TableRowActionsMenu label={`Open row actions for payment ${payment.invoiceNumber}`}>
                          <TableRowActionsMenuLink
                            href={`/payments/${payment.id}`}
                            label="Open payment"
                            iconName="eye"
                          />
                          <TableRowActionsMenuLink
                            href={`/invoices/${payment.invoiceId}`}
                            label="Open invoice"
                            iconName="fileText"
                          />
                        </TableRowActionsMenu>
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
