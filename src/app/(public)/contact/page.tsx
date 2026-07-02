import Image from "next/image";
import Link from "next/link";

import { ArrowRight, ClipboardCheck, Clock3, Mail, MapPin, PhoneCall } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { getWebsiteShellData } from "@/features/website/queries/website-queries";

export const dynamic = "force-dynamic";

const OFFICIAL_WEBSITE_LOGO_SRC = "/brand/website-official-logo-transparent.png";
const WEBSITE_HERO_BACKGROUND_SRC = "/brand/website-hero-background.png";
const WEBSITE_FEATURE_BACKGROUND_SRC = "/brand/website-feature-background.png";
const STORE_HOURS = {
  weekdays: "Monday–Saturday: 7:00 AM–5:00 PM",
  sunday: "Sunday: Closed",
} as const;

export default async function ContactPage() {
  const shellData = await getWebsiteShellData();

  return (
    <div className="bg-[#030B18] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <Image
          src={WEBSITE_HERO_BACKGROUND_SRC}
          alt="SAY Auto Care contact page background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,11,24,0.95)_0%,rgba(3,11,24,0.82)_45%,rgba(3,11,24,0.54)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(215,25,32,0.16),transparent_24%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-end">
            <div className="max-w-[620px]">
              <BrandLogo
                src={OFFICIAL_WEBSITE_LOGO_SRC}
                alt={shellData.businessName}
                width={420}
                height={152}
                className="h-auto w-full max-w-[220px] object-contain sm:max-w-[260px]"
                priority
                surface="dark"
              />

              <div className="mt-8 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/66">
                <span className="h-px w-10 bg-brand-red" />
                Contact SAY Auto Care
              </div>
              <h1 className="mt-6 font-display text-[2.7rem] uppercase leading-[0.94] tracking-[0.04em] text-white sm:text-[3.5rem] lg:text-[4.35rem]">
                Let&apos;s Get Your Vehicle
                <br />
                <span className="text-brand-red">Road-Ready.</span>
              </h1>
              <p className="mt-5 max-w-[560px] text-base leading-8 text-white/76 sm:text-lg">
                Need a service quote, product inquiry, or direct workshop assistance? Reach the SAY Auto Care team through the channel that works best for you.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  variant="yellowPrimary"
                  size="pill"
                  className="h-12 rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="/get-quote">
                    Service Quote
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ContactSummaryCard
                icon={<PhoneCall className="size-5" />}
                label="Call the shop"
                value={shellData.contactNumber ?? "Please contact the shop for the latest number."}
              />
              <ContactSummaryCard
                icon={<Mail className="size-5" />}
                label="Email us"
                value={shellData.email ?? "Email details can be confirmed through the shop directly."}
              />
              <ContactSummaryCard
                icon={<MapPin className="size-5" />}
                label="Visit the branch"
                value={shellData.address ?? "Please contact the shop for the latest address details."}
                className="sm:col-span-2 lg:col-span-1"
              />
              <ContactSummaryCard
                icon={<Clock3 className="size-5" />}
                label="Store Hours"
                className="sm:col-span-2 lg:col-span-1"
              >
                <p className="mt-2 text-base leading-7 text-white/84">{STORE_HOURS.weekdays}</p>
                <p className="text-base leading-7 text-white/84">{STORE_HOURS.sunday}</p>
              </ContactSummaryCard>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#061224]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <DarkInfoCard
              eyebrow="Business Details"
              title="Visit or call the shop."
              description="For diagnostics, repairs, parts availability, and service quote concerns, contact SAY Auto Care Center directly."
            >
              <div className="space-y-4 text-sm leading-7 text-white/72">
                <p>
                  <span className="font-semibold text-white">Shop:</span> {shellData.businessName}
                </p>
                <p>
                  <span className="font-semibold text-white">Branch:</span> {shellData.branchName}
                </p>
                <p>
                  <span className="font-semibold text-white">Address:</span>{" "}
                  {shellData.address ?? "Please contact the shop for the latest address details."}
                </p>
                <p>
                  <span className="font-semibold text-white">Phone:</span>{" "}
                  {shellData.contactNumber ?? "Please contact the shop for the latest number."}
                </p>
                <div>
                  <p>
                    <span className="font-semibold text-white">Store Hours:</span>
                  </p>
                  <p>{STORE_HOURS.weekdays}</p>
                  <p>{STORE_HOURS.sunday}</p>
                </div>
                {shellData.email ? (
                  <p>
                    <span className="font-semibold text-white">Email:</span> {shellData.email}
                  </p>
                ) : null}
              </div>
            </DarkInfoCard>

            <DarkInfoCard
              eyebrow="Best Next Step"
              title="Request a service quote or ask about the next step."
              description="Use the service quote form for maintenance, repairs, diagnostics, and inspection concerns. For products, you can also call or visit the shop directly."
              action={
                <Button
                  asChild
                  variant="yellowPrimary"
                  size="pill"
                  className="h-11 rounded-xl px-5 text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="/get-quote">Open the service form</Link>
                </Button>
              }
            >
              <div className="space-y-3 text-sm leading-7 text-white/72">
                <p>
                  Share your vehicle make, model, and concern when you need service advice or a workshop quotation.
                </p>
                <p>
                  For tires, batteries, oils, and other catalog items, use this page or the phone number to confirm availability before coming to the shop.
                </p>
              </div>
            </DarkInfoCard>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#030B18]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:items-center lg:px-8 lg:py-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07172d] shadow-[0_26px_60px_rgba(0,0,0,0.28)]">
            <div className="relative aspect-[16/11]">
              <Image
                src={WEBSITE_FEATURE_BACKGROUND_SRC}
                alt="SAY Auto Care workshop contact preview"
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,11,24,0.08),rgba(3,11,24,0.44))]" />
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeading
              eyebrow="Need direct support?"
              title="Choose the contact path that fits your concern."
              description="Whether you need a service quotation, a quick product inquiry, or a direct branch visit, the website now keeps those next steps clear and easy to follow."
              align="left"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FeaturePoint
                icon={<ClipboardCheck className="size-5" />}
                title="Service Quote"
                description="Best for maintenance, repairs, diagnostics, inspections, and other workshop concerns."
              />
              <FeaturePoint
                icon={<MapPin className="size-5" />}
                title="Visit the Shop"
                description="Ideal when you need in-person assistance, fitment help, or a closer inspection."
              />
              <FeaturePoint
                icon={<PhoneCall className="size-5" />}
                title="Call Ahead"
                description="Use the branch number to ask about service timing, availability, and next steps."
              />
              <FeaturePoint
                icon={<Mail className="size-5" />}
                title="Email Support"
                description="Useful for written follow-up, formal inquiries, and shop communication."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#061224]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,23,53,0.96),rgba(4,12,28,0.96))] px-6 py-7 shadow-[0_26px_70px_rgba(0,0,0,0.32)] sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-red">
                  Ready to get started?
                </p>
                <h2 className="text-3xl font-semibold uppercase tracking-[0.03em] text-white sm:text-4xl">
                  Request a service quote and let the team guide your next service step.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-white/72">
                  Start with the service quote form, or browse the catalog first if you need product-related support before contacting the shop.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  variant="yellowPrimary"
                  size="pill"
                  className="h-12 rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="/get-quote">
                    Service Quote
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outlineLight"
                  size="pill"
                  className="h-12 rounded-xl border-white/18 bg-transparent px-6 text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="/catalog">
                    Browse Catalog
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl text-left"}>
      <p className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-brand-red">
        <span className="h-px w-8 bg-brand-red" />
        {eyebrow}
        <span className="h-px w-8 bg-brand-red" />
      </p>
      <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[0.03em] text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-white/72">{description}</p>
    </div>
  );
}

function ContactSummaryCard({
  icon,
  label,
  value,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[1.5rem] border border-white/10 bg-white/[0.06] px-5 py-5 backdrop-blur-sm ${className ?? ""}`}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
        {icon}
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/52">
        {label}
      </p>
      {children ?? (
        <p className="mt-2 whitespace-pre-line text-base leading-7 text-white/84">{value}</p>
      )}
    </div>
  );
}

function DarkInfoCard({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,24,53,0.92),rgba(5,15,32,0.98))] p-6 shadow-[0_20px_54px_rgba(0,0,0,0.24)] sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-red">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-2xl font-semibold uppercase tracking-[0.03em] text-white sm:text-[2rem]">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-white/72">{description}</p>
      <div className="mt-6">{children}</div>
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}

function FeaturePoint({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-5">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
        {icon}
      </div>
      <p className="mt-4 text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-white/68">{description}</p>
    </div>
  );
}
