import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Mail,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { QuoteRequestForm } from '@/features/website/components/quote-request-form';
import {
  getWebsiteQuoteFormOptions,
  getWebsiteShellData,
} from '@/features/website/queries/website-queries';

export const dynamic = 'force-dynamic';

const WEBSITE_HERO_BACKGROUND_SRC = '/brand/website-hero-background.png';

const HERO_POINTS = [
  { icon: Wrench, label: 'Service-focused intake' },
  { icon: CarFront, label: 'Vehicle details first' },
  { icon: ShieldCheck, label: 'Clear next-step follow-up' },
] as const;

const SUPPORT_STEPS = [
  {
    icon: ClipboardCheck,
    title: 'Initial review',
    description:
      'The shop checks the vehicle details, requested service, and customer concern before responding.',
  },
  {
    icon: Clock3,
    title: 'Response timing',
    description:
      'Adding complete vehicle information helps reduce follow-up questions and speeds up the first reply.',
  },
  {
    icon: PhoneCall,
    title: 'Direct contact',
    description:
      'If needed, the branch can contact you directly to clarify the next service step before preparing a quote.',
  },
] as const;

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
    <div className="bg-[#030B18] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <Image
          src={WEBSITE_HERO_BACKGROUND_SRC}
          alt="SAY Auto Care service quote background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,11,24,0.94)_0%,rgba(3,11,24,0.82)_46%,rgba(3,11,24,0.64)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(215,25,32,0.18),transparent_26%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
            <div className="max-w-[720px]">
              <div className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/66">
                <span className="h-px w-10 bg-brand-red" />
                Service Quote
              </div>
              <h1 className="mt-6 font-display text-[2.9rem] uppercase leading-[0.94] tracking-[0.04em] text-white sm:text-[3.7rem] lg:text-[4.6rem]">
                Tell Us What Your
                <br />
                <span className="text-brand-red">Vehicle Needs.</span>
              </h1>
              <p className="mt-5 max-w-[620px] text-base leading-8 text-white/76 sm:text-lg">
                Share your vehicle details and service concern so the shop can prepare a clearer
                recommendation and the right next step for your inquiry.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  variant="yellowPrimary"
                  size="pill"
                  className="h-12 rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="#quote-form">
                    Start the form
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outlineLight"
                  size="pill"
                  className="h-12 rounded-xl border-white/18 bg-white/5 px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="/catalog">
                    Browse Catalog
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {HERO_POINTS.map((point) => (
                  <HeroPoint key={point.label} icon={point.icon} label={point.label} />
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,23,53,0.96),rgba(4,12,28,0.96))] p-6 shadow-[0_24px_56px_rgba(0,0,0,0.28)] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-red">
                Before You Submit
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Give the shop enough detail to respond clearly.
              </h2>
              <div className="mt-6 space-y-4">
                {SUPPORT_STEPS.map((step) => (
                  <SupportStep
                    key={step.title}
                    icon={step.icon}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="quote-form" className="bg-[#061224]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          {submitted === '1' ? (
            <div className="mb-6 rounded-[1.5rem] border border-emerald-400/24 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100 shadow-[0_14px_32px_rgba(16,185,129,0.08)] sm:px-6">
              Your service quote request has been sent. The shop can now review your details and
              follow up.
            </div>
          ) : null}

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start">
            <div className="min-w-0">
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

            <aside className="space-y-5">
              <InfoPanel
                eyebrow="What happens next"
                title="The branch reviews your request and reaches out with the next step."
              >
                <div className="space-y-3 text-sm leading-7 text-white/70">
                  <p>
                    The team uses your vehicle details and service concern to decide whether the
                    next step should be a service quote, product recommendation, or direct shop
                    inspection.
                  </p>
                  <p>
                    If the branch needs more detail, they can follow up before giving you a clearer
                    recommendation.
                  </p>
                </div>
              </InfoPanel>

              <InfoPanel
                eyebrow="Contact reminder"
                title="Prefer to talk first?"
              >
                <div className="space-y-4 text-sm text-white/70">
                  <div className="flex items-start gap-3">
                    <PhoneCall className="mt-0.5 size-4 shrink-0 text-brand-red" />
                    <div>
                      <p className="font-semibold text-white">Call the shop</p>
                      <p className="mt-1">
                        {shellData.contactNumber ??
                          'Please contact the branch for the latest number.'}
                      </p>
                    </div>
                  </div>
                  {shellData.email ? (
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 size-4 shrink-0 text-brand-red" />
                      <div>
                        <p className="font-semibold text-white">Email support</p>
                        <p className="mt-1">{shellData.email}</p>
                      </div>
                    </div>
                  ) : null}
                  {shellData.address ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand-red" />
                      <div>
                        <p className="font-semibold text-white">Visit the branch</p>
                        <p className="mt-1">{shellData.address}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </InfoPanel>

              <InfoPanel
                eyebrow="Good to include"
                title="A few extra details help the team answer faster."
              >
                <ul className="space-y-3 text-sm leading-7 text-white/70">
                  <QuoteTip>Exact vehicle make, model, year, and transmission</QuoteTip>
                  <QuoteTip>Symptoms, noises, warning lights, or drivability concerns</QuoteTip>
                  <QuoteTip>Relevant mileage, engine size, or fluid requirement if known</QuoteTip>
                </ul>
              </InfoPanel>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroPoint({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/90">
        {label}
      </p>
    </div>
  );
}

function SupportStep({
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
      <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
        <Icon className="size-4" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-sm leading-6 text-white/68">{description}</p>
      </div>
    </div>
  );
}

function InfoPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,24,53,0.96),rgba(4,12,28,0.98))] p-5 shadow-[0_22px_52px_rgba(0,0,0,0.24)] sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-red">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function QuoteTip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="mt-1 size-4 shrink-0 text-brand-red" />
      <span>{children}</span>
    </li>
  );
}
