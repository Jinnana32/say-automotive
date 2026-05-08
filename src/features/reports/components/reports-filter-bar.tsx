'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DateTime } from 'luxon';

import { ModalDialog } from '@/components/shared/modal-dialog';
import { useGlobalLoadingOverlay } from '@/components/shared/providers/global-loading-overlay-provider';
import { Button } from '@/components/ui/button';
import type {
  ReportGroupBy,
  ReportPreset,
  ReportsFilterState,
} from '@/features/reports/types';
import { getPresetDateRange } from '@/features/reports/utils';
import { formatDate } from '@/lib/dates';

const PRESET_OPTIONS: Array<{ value: ReportPreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This week' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom' },
];

const GROUP_OPTIONS: Array<{ value: ReportGroupBy; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function ReportsFilterBar({ filters }: { filters: ReportsFilterState }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { showOverlay } = useGlobalLoadingOverlay();
  const [customFrom, setCustomFrom] = useState(filters.from);
  const [customTo, setCustomTo] = useState(filters.to);

  const isCustom = filters.preset === 'custom';
  const hasValidCustomRange =
    customFrom.length > 0 && customTo.length > 0 && customFrom <= customTo;

  useEffect(() => {
    if (!isPending) {
      return;
    }

    return showOverlay({
      label: 'Updating reports',
      description:
        'Refreshing metrics, charts, and supporting tables for the selected range.',
    });
  }, [isPending, showOverlay]);

  function applyFilters(next: {
    preset: ReportPreset;
    from: string;
    to: string;
    groupBy: ReportGroupBy;
  }) {
    const params = new URLSearchParams();

    params.set('preset', next.preset);
    params.set('from', next.from);
    params.set('to', next.to);
    params.set('groupBy', next.groupBy);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function handlePresetChange(nextPreset: ReportPreset) {
    if (nextPreset === 'custom') {
      return;
    }

    const now = DateTime.now().setZone('Asia/Manila');
    const range = getPresetDateRange(nextPreset, now);

    applyFilters({
      preset: nextPreset,
      from: range.from.toISODate() ?? filters.from,
      to: range.to.toISODate() ?? filters.to,
      groupBy: range.defaultGroupBy,
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 flex-row flex-col lg:flex-row lg:justify-between lg:items-center">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Reporting filter:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS.map((option) =>
                option.value === 'custom' ? (
                  <ModalDialog
                    key={option.value}
                    title="Custom report range"
                    description="Choose the exact reporting window for period-based metrics."
                    trigger={({ openDialog }) => (
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          filters.preset === option.value
                            ? 'bluePrimary'
                            : 'outline'
                        }
                        disabled={isPending}
                        onClick={() => {
                          setCustomFrom(filters.from);
                          setCustomTo(filters.to);
                          openDialog();
                        }}
                      >
                        {option.label}
                      </Button>
                    )}
                  >
                    {({ closeDialog }) => (
                      <div className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                              From date
                            </label>
                            <input
                              type="date"
                              value={customFrom}
                              onChange={(event) =>
                                setCustomFrom(event.target.value)
                              }
                              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                              To date
                            </label>
                            <input
                              type="date"
                              value={customTo}
                              onChange={(event) =>
                                setCustomTo(event.target.value)
                              }
                              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                            />
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                          <p className="text-sm font-medium text-foreground">
                            {hasValidCustomRange
                              ? `${formatDate(customFrom)} to ${formatDate(customTo)}`
                              : 'Choose a valid start and end date to render the custom report.'}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Trend grouping stays in the main filter bar so you
                            can switch between daily, weekly, and monthly views
                            without reopening this modal.
                          </p>
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={closeDialog}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="bluePrimary"
                            disabled={!hasValidCustomRange || isPending}
                            onClick={() => {
                              closeDialog();
                              applyFilters({
                                preset: 'custom',
                                from: customFrom,
                                to: customTo,
                                groupBy: filters.groupBy,
                              });
                            }}
                          >
                            Show custom report
                          </Button>
                        </div>
                      </div>
                    )}
                  </ModalDialog>
                ) : (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={
                      filters.preset === option.value
                        ? 'bluePrimary'
                        : 'outline'
                    }
                    disabled={isPending}
                    onClick={() => handlePresetChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ),
              )}
            </div>
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Period: {filters.periodLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
