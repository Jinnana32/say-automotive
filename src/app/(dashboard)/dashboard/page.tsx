import Link from 'next/link';
import {
  AlertTriangle,
  CarFront,
  ClipboardList,
  PackageSearch,
  ReceiptText,
  Users,
} from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';
import { MetricGrid } from '@/components/shared/metric-grid';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QuotationStatusBadge } from '@/features/quotations/components/quotation-status-badge';
import { JobOrderStatusBadge } from '@/features/job-orders/components/job-order-status-badge';
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge';
import { getDashboardData } from '@/features/dashboard/queries/dashboard-queries';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/dates';
import { formatInventoryQuantity } from '@/features/inventory/utils';

export const dynamic = 'force-dynamic';

const DASHBOARD_NAVY = '#0B1F4D';
const DASHBOARD_NAVY_HOVER = '#081735';
const DASHBOARD_NAVY_TINT = '#EAF1FB';
const DASHBOARD_NAVY_MUTED = '#CDD9EE';
const DASHBOARD_RED_ACCENT = '#D62828';

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations dashboard"
        description="Live workshop, billing, and stock activity in one operational view."
        actions={
          <Button asChild variant="navyPrimary">
            <Link href="/quick-access">Open quick access</Link>
          </Button>
        }
      />

      <MetricGrid className="xl:grid-cols-3">
        <StatCard
          title="Customers"
          value={String(dashboard.metrics.totalCustomers)}
          description="Active customer records"
          icon={Users}
        />
        <StatCard
          title="Vehicles"
          value={String(dashboard.metrics.totalVehicles)}
          description="Tracked vehicle profiles"
          icon={CarFront}
        />
        <StatCard
          title="Pending quotations"
          value={String(dashboard.metrics.pendingQuotations)}
          description="Draft and approval queue"
          icon={ClipboardList}
          tone={dashboard.metrics.pendingQuotations > 0 ? 'warning' : 'neutral'}
          badge={
            dashboard.metrics.pendingQuotations > 0 ? 'Needs review' : 'Clear'
          }
        />
        <StatCard
          title="Active job orders"
          value={String(dashboard.metrics.activeJobOrders)}
          description="Current workshop workload"
          icon={ClipboardList}
          tone={dashboard.metrics.activeJobOrders > 0 ? 'info' : 'neutral'}
          badge={dashboard.metrics.activeJobOrders > 0 ? 'In motion' : 'Idle'}
        />
        <StatCard
          title="Low stock items"
          value={String(dashboard.metrics.lowStockItems)}
          description="Below reorder threshold"
          icon={PackageSearch}
          tone={dashboard.metrics.lowStockItems > 0 ? 'warning' : 'neutral'}
          badge={dashboard.metrics.lowStockItems > 0 ? 'Attention' : 'Stable'}
        />
        <StatCard
          title="Unpaid invoices"
          value={String(dashboard.metrics.unpaidInvoices)}
          description="Outstanding balances"
          icon={ReceiptText}
          tone={
            dashboard.metrics.unpaidInvoices > 0 ? 'destructive' : 'neutral'
          }
          badge={
            dashboard.metrics.unpaidInvoices > 0 ? 'Collection due' : 'Settled'
          }
        />
      </MetricGrid>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Recent quotations"
          description="Latest estimates waiting to move into workshop execution."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/quotations">View all</Link>
            </Button>
          }
          contentClassName="p-0"
        >
          {dashboard.recentQuotations.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No recent quotations"
                description="New estimates will appear here once the front desk starts building them."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recentQuotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <Link
                          href={`/quotations/${quotation.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {quotation.quotationNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(quotation.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{quotation.customerName}</TableCell>
                    <TableCell>
                      <QuotationStatusBadge status={quotation.status} />
                    </TableCell>
                    <TableCell>
                      {formatCurrency(quotation.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard
          title="Recent job orders"
          description="Current workshop documents entering active service and billing."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/job-orders">View all</Link>
            </Button>
          }
          contentClassName="p-0"
        >
          {dashboard.recentJobOrders.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No recent job orders"
                description="Approved quotations will create job orders and surface here."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recentJobOrders.map((jobOrder) => (
                  <TableRow key={jobOrder.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <Link
                          href={`/job-orders/${jobOrder.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {jobOrder.jobOrderNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(jobOrder.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{jobOrder.customerName}</TableCell>
                    <TableCell>{jobOrder.vehicleLabel}</TableCell>
                    <TableCell>
                      <JobOrderStatusBadge status={jobOrder.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <SectionCard
          title="Collections trend"
          description="Monthly payment intake across the last six months."
        >
          {dashboard.revenueTrend.length === 0 ? (
            <EmptyState
              title="No payment trend yet"
              description="Once invoice payments are recorded, monthly collections will appear here."
            />
          ) : (
            <TrendBars
              data={dashboard.revenueTrend}
              valueFormatter={(value) => formatCurrency(value)}
              footerLabel="Total collected"
              footerValue={formatCurrency(
                dashboard.revenueTrend.reduce(
                  (sum, item) => sum + item.value,
                  0,
                ),
              )}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Service throughput"
          description="Completed operational work entering billing or release flow."
        >
          {dashboard.serviceTrend.length === 0 ? (
            <EmptyState
              title="No service trend yet"
              description="Once job orders progress through execution, service throughput will appear here."
            />
          ) : (
            <TrendBars
              data={dashboard.serviceTrend}
              valueFormatter={(value) => `${value} jobs`}
              footerLabel="Completed jobs"
              footerValue={String(
                dashboard.serviceTrend.reduce(
                  (sum, item) => sum + item.value,
                  0,
                ),
              )}
            />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Inventory alerts"
          description="Products already under or at reorder threshold."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/inventory">Open inventory</Link>
            </Button>
          }
        >
          {dashboard.inventoryAlerts.length === 0 ? (
            <EmptyState
              title="No inventory alerts"
              description="Low-stock products will appear here when on-hand levels drop near reorder thresholds."
              icon={<PackageSearch className="size-5" />}
            />
          ) : (
            <div className="space-y-3">
              {dashboard.inventoryAlerts.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.sku ?? 'No SKU'}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge tone="warning">Low stock</StatusBadge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatInventoryQuantity(item.availableQuantity)}{' '}
                      available · reorder{' '}
                      {item.reorderLevel !== null
                        ? formatInventoryQuantity(item.reorderLevel)
                        : 'not set'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Outstanding invoices"
          description="Balances that still need collection before the workflow closes."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/invoices">Open invoices</Link>
            </Button>
          }
        >
          {dashboard.unpaidInvoices.length === 0 ? (
            <EmptyState
              title="No unpaid invoices"
              description="Open invoice balances will appear here as billing activity grows."
              icon={<AlertTriangle className="size-5" />}
            />
          ) : (
            <div className="space-y-3">
              {dashboard.unpaidInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 px-4 py-3"
                >
                  <div>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {invoice.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <InvoiceStatusBadge status={invoice.status} />
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatCurrency(invoice.balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function TrendBars({
  data,
  valueFormatter,
  footerLabel,
  footerValue,
}: {
  data: Array<{ label: string; value: number }>;
  valueFormatter: (value: number) => string;
  footerLabel: string;
  footerValue: string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const currentPeriodIndex = data.length - 1;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-6 gap-3">
        {data.map((item, index) => {
          const isCurrentPeriod = index === currentPeriodIndex;
          const isEmphasized = item.value === maxValue && item.value > 0;
          const barColor = isCurrentPeriod
            ? DASHBOARD_NAVY
            : isEmphasized
              ? DASHBOARD_NAVY_HOVER
              : DASHBOARD_NAVY_MUTED;

          return (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div
                className="flex h-40 w-full items-end rounded-2xl border border-[#D9E1EC] p-2"
                style={{ backgroundColor: DASHBOARD_NAVY_TINT }}
              >
                <div
                  className="relative w-full overflow-hidden rounded-xl"
                  style={{
                    backgroundColor: barColor,
                    height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 10 : 4)}%`,
                  }}
                >
                  {isCurrentPeriod && item.value > 0 ? (
                    <div
                      className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
                      style={{ backgroundColor: DASHBOARD_RED_ACCENT }}
                    />
                  ) : null}
                </div>
              </div>
              <div className="space-y-0.5 text-center">
                <p className="text-xs font-medium text-foreground">
                  {item.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {valueFormatter(item.value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
        <p className="text-sm text-muted-foreground">{footerLabel}</p>
        <p className="text-sm font-semibold text-foreground">{footerValue}</p>
      </div>
    </div>
  );
}
