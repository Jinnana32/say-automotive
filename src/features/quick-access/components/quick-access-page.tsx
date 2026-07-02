import Link from 'next/link';
import { Search } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { QuickAccessResultsWorkspace } from '@/features/quick-access/components/quick-access-results-workspace';
import { QuickAccessSearchDialog } from '@/features/quick-access/components/quick-access-search-dialog';
import type { QuickAccessSearchState } from '@/features/quick-access/types';
import { QuickQuotation } from './quick-quotation';

export function QuickAccessPage({
  searchState,
}: {
  searchState: QuickAccessSearchState;
}) {
  const hasSearch = Boolean(
    searchState.plateQuery || searchState.customerLastNameQuery,
  );
  const hasResults = searchState.records.length > 0;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col gap-6 pb-24">
      <PageHeader
        title="Quick Access"
        description="Use this intake workspace to pull up a returning customer or vehicle record quickly, then jump into the next action."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />

      {!hasSearch ? (
        <div className="flex min-h-[55vh] flex-1 items-center justify-center">
          <div className="w-full max-w-2xl">
            <EmptyState
              icon={<Search className="size-5" />}
              title="No active lookup yet"
              description="Start with the floating search button to look up a vehicle by plate number or pull up a customer by last name."
            />
          </div>
        </div>
      ) : hasResults ? (
        <QuickAccessResultsWorkspace
          key={`${searchState.plateQuery}:${searchState.customerLastNameQuery}`}
          records={searchState.records}
          plateQuery={searchState.plateQuery}
          customerLastNameQuery={searchState.customerLastNameQuery}
          canCreateQuotations={searchState.permissions.canCreateQuotations}
          canViewQuotations={searchState.permissions.canViewQuotations}
          canViewServiceHistory={searchState.permissions.canViewServiceHistory}
          canRecordPastService={searchState.permissions.canRecordPastService}
        />
      ) : (
        <div className="flex min-h-[55vh] flex-1 items-center justify-center">
          <div className="w-full max-w-2xl">
            <EmptyState
              title="No record matched that lookup"
              description={
                searchState.plateQuery
                  ? `No vehicle record matched "${searchState.plateQuery}". Try another plate format or search by customer last name instead.`
                  : `No customer matched "${searchState.customerLastNameQuery}". Try another spelling or switch to a vehicle lookup.`
              }
            />
          </div>
        </div>
      )}

      <QuickQuotation />

      <QuickAccessSearchDialog
        initialPlate={searchState.plateQuery}
        initialCustomerLastName={searchState.customerLastNameQuery}
      />
    </div>
  );
}
