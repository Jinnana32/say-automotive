import Link from 'next/link';

import { Clock3, PhoneCall, ShieldCheck, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { QuoteRequestForm } from '@/features/website/components/quote-request-form';
import { PageHeader } from '@/features/website/components/page-header';
import { SectionContainer } from '@/features/website/components/section-container';
import { websiteCardVariants } from '@/features/website/components/website-card-variants';
import {
  getWebsiteQuoteFormOptions,
  getWebsiteShellData,
} from '@/features/website/queries/website-queries';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// TODO: Add type for searchParams
type GetQuotePageProps = {
  searchParams: Promise<{
    submitted?: string;
  }>;
};

export default async function GetQuotePage({
  searchParams,
}: GetQuotePageProps) {
  const { submitted } = await searchParams;
  const [options, shellData] = await Promise.all([
    getWebsiteQuoteFormOptions(),
    getWebsiteShellData(),
  ]);

  return (
    <div className="bg-[#f3f5fa]">
      <SectionContainer tone="navy" spacing="hero">
        <PageHeader
          eyebrow="Request your service quotation"
          title="TELL US WHAT YOUR CAR NEEDS."
          description="Share your vehicle details and service concern so the shop can prepare a clearer recommendation and service quotation."
          inverse
          titleTag="h1"
          size="hero"
          actions={
            <div className="flex gap-4 pb-12">
              <Button asChild variant="yellowPrimary" size="pill">
                <Link href="/catalog">Browse products</Link>
              </Button>
              <Button asChild variant="outlineLight" size="pill">
                <Link href="/contact">Contact the shop</Link>
              </Button>
            </div>
          }
        />
      </SectionContainer>

      <SectionContainer tone="muted" spacing="compact" className="-mt-12 pt-0">
        <div className="mx-auto max-w-6xl">
          {submitted === '1' ? (
            <div className="mb-5 rounded-2xl border border-[#9ac5a4] bg-[#edf7f0] px-5 py-4 text-sm text-[#1f5b30] shadow-[0_14px_30px_rgba(22,101,52,0.08)]">
              Your service quote request has been sent. The shop can now review
              your details and follow up.
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <QuoteRequestForm
                options={options}
                initialValues={{
                  firstName: '',
                  lastName: '',
                  contactNumber: '',
                  email: '',
                  province: '',
                  city: '',
                  barangay: '',
                  vehicleMake: '',
                  vehicleModel: '',
                  vehicleYear: '',
                  transmission: '',
                  mileage: '',
                  engineSize: '',
                  oilRequirementLiters: '',
                  serviceNeeded: '',
                  customerConcern: '',
                }}
              />
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl bg-[linear-gradient(135deg,#0d245f_0%,#173c99_100%)] p-5 text-white shadow-[0_22px_44px_rgba(7,18,57,0.18)] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffd24a]">
                  What happens next
                </p>
                <h2 className="mt-3 text-xl font-semibold leading-tight text-white">
                  The shop reviews your request and follows up with the next
                  step.
                </h2>
                <div className="mt-5 space-y-4">
                  <HelperStep
                    icon={ShieldCheck}
                    title="Initial review"
                    description="The details are checked against the requested service and the vehicle information you provided."
                  />
                  <HelperStep
                    icon={Clock3}
                    title="Response timing"
                    description="Provide as much vehicle information as possible to reduce back-and-forth."
                  />
                  <HelperStep
                    icon={PhoneCall}
                    title="Direct contact"
                    description={`If needed, the shop can follow up by phone at ${shellData.contactNumber ?? 'the contact number provided by the branch'}.`}
                  />
                </div>
              </div>

              <div
                className={cn(
                  websiteCardVariants({ variant: 'feature' }),
                  'space-y-3',
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#173c99]">
                  Contact reminder
                </p>
                <p className="text-sm leading-6 text-[#4d5f7f]">
                  Prefer to talk first? You can still call the shop directly
                  before filling out the service form.
                </p>
                <p className="text-base font-semibold text-[#10224d]">
                  {shellData.contactNumber ??
                    'Please contact the shop for the latest number.'}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}

function HelperStep({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#ffd24a]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-sm leading-6 text-[#d8e3ff]">{description}</p>
      </div>
    </div>
  );
}
