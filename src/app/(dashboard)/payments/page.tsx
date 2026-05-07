import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentMethodBadge } from "@/features/invoices/components/invoice-status-badge";
import { listPayments } from "@/features/invoices/queries/invoice-queries";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

type PaymentsPageProps = {
  searchParams: Promise<{
    search?: string;
    paymentMethod?: "cash" | "gcash" | "card" | "bank_transfer" | "check";
  }>;
};

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const { search = "", paymentMethod = "" } = await searchParams;
  const payments = await listPayments({ search, paymentMethod });

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

      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <form className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search by invoice or customer"
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <select
              name="paymentMethod"
              defaultValue={paymentMethod}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All methods</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="check">Check</option>
            </select>
            <Button type="submit">Apply filters</Button>
          </form>

          {payments.length === 0 ? (
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
            <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
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
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
                      <TableCell className="font-semibold">{payment.invoiceNumber}</TableCell>
                      <TableCell>{payment.jobOrderNumber ?? "POS flow"}</TableCell>
                      <TableCell>{payment.customerName}</TableCell>
                      <TableCell>
                        <PaymentMethodBadge method={payment.paymentMethod} />
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.referenceNumber ?? "No reference"}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/invoices/${payment.invoiceId}`}>Open invoice</Link>
                        </Button>
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
