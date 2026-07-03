import Link from 'next/link';
import { Eye } from 'lucide-react';

import { IconActionLink } from '@/components/shared/icon-action';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InventoryMovementTypeBadge } from '@/features/inventory/components/inventory-status-badge';
import { OperationalAlerts } from '@/features/reports/components/operational-alerts';
import { PaymentMethodMix } from '@/features/reports/components/payment-method-mix';
import { ReportsFilterBar } from '@/features/reports/components/reports-filter-bar';
import { ReportsKpiCard } from '@/features/reports/components/reports-kpi-card';
import { RevenueTrendChart } from '@/features/reports/components/revenue-trend-chart';
import { StatusBreakdowns } from '@/features/reports/components/status-breakdowns';
import { TopItemsPanel } from '@/features/reports/components/top-items-panel';
import { WorkflowFunnel } from '@/features/reports/components/workflow-funnel';
import { getReportsPageData } from '@/features/reports/queries/report-queries';
import { formatCurrency } from '@/lib/currency';
import { formatDateTime } from '@/lib/dates';

export const dynamic = 'force-dynamic';

type ReportsPageProps = {
  searchParams: Promise<{
    preset?: string;
    from?: string;
    to?: string;
    groupBy?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const reports = await getReportsPageData(resolvedSearchParams);
  const reportSearch = new URLSearchParams({
    preset: reports.filters.preset,
    from: reports.filters.from,
    to: reports.filters.to,
    groupBy: reports.filters.groupBy,
  }).toString();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Operational and financial performance across quotations, job orders, POS sales, and inventory movement."
        actions={
          <>
            <Button asChild variant="outlineBlue">
              <Link href={`/reports/print?${reportSearch}`} target="_blank" rel="noreferrer">
                Print report
              </Link>
            </Button>
            <Button asChild variant="bluePrimary">
              <a href={`/api/reports/pdf?${reportSearch}`}>Download PDF</a>
            </Button>
          </>
        }
      />

      <ReportsFilterBar filters={reports.filters} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Period performance
          </h2>
          <p className="text-sm text-muted-foreground">
            These metrics respond to the selected reporting range and grouping.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reports.periodPerformanceMetrics.map((metric) => (
            <ReportsKpiCard key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.35fr_0.65fr]">
        <RevenueTrendChart
          data={reports.revenueTrend}
          groupBy={reports.filters.groupBy}
        />
        <WorkflowFunnel steps={reports.workflowFunnel} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TopItemsPanel
          title="Top services"
          description="Highest-value service and labor lines billed in the selected period."
          items={reports.topServices}
          quantityLabel="rendered"
        />
        <TopItemsPanel
          title="Top products and parts"
          description="Combined product movement from service billing and completed POS sales."
          items={reports.topProducts}
          quantityLabel="units"
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Operational alerts
          </h2>
          <p className="text-sm text-muted-foreground">
            These are live operational metrics and do not depend on the selected
            reporting period.
          </p>
        </div>
        <OperationalAlerts metrics={reports.operationalAlerts} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PaymentMethodMix items={reports.paymentMethodBreakdown} />
        <StatusBreakdowns
          quotationStatuses={reports.quotationStatusBreakdown}
          periodJobOrderStatuses={reports.periodJobOrderStatusBreakdown}
          liveJobOrderStatuses={reports.liveJobOrderStatusBreakdown}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Unpaid invoices</CardTitle>
            <CardDescription>
              Live receivables that still need collection follow-up or block
              vehicle release.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.unpaidInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No unpaid invoices at the moment.
              </p>
            ) : (
              <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.unpaidInvoices.map((invoice) => (
                      <TableRow key={invoice.invoiceId}>
                        <TableCell className="font-semibold">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell className="capitalize">
                          {invoice.status.replaceAll('_', ' ')}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.balance)}</TableCell>
                        <TableCell>
                          {formatDateTime(invoice.createdAt)}
                        </TableCell>
                        <TableCell className="w-14 text-right">
                          <IconActionLink
                            href={`/invoices/${invoice.invoiceId}`}
                            label={`Open invoice ${invoice.invoiceNumber}`}
                            icon={Eye}
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

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Recent stock movements</CardTitle>
            <CardDescription>
              Supporting inventory context while reviewing financial and
              operational performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.recentStockMovements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stock movements recorded yet.
              </p>
            ) : (
              reports.recentStockMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">
                        {movement.productName}
                      </p>
                      <div className="flex items-center gap-3">
                        <InventoryMovementTypeBadge
                          type={movement.movementType}
                        />
                        <span className="text-sm text-muted-foreground">
                          Qty{' '}
                          {movement.quantity.toFixed(4).replace(/\.?0+$/, '')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(movement.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
