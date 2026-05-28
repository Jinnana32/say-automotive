import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gauge, ShieldCheck, Users, Wrench } from "lucide-react";

import { LoginForm } from "@/features/auth/components/login-form";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { getAppSessionState } from "@/lib/auth/session";

const HERO_FEATURES = [
  { label: "Expert Technicians", icon: Wrench },
  { label: "Premium Equipment", icon: Gauge },
  { label: "Quality Service", icon: ShieldCheck },
  { label: "Customer Focused", icon: Users },
] as const;

const FULL_LOGO_SRC = "/brand/say-logo-full.png";
const SHIELD_LOGO_SRC = "/brand/say-shield.png";
const LOGIN_BACKGROUND_SRC = "/brand/login-background.png";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, resolvedSearchParams] = await Promise.all([
    getAppSessionState(),
    searchParams,
  ]);

  const reason = Array.isArray(resolvedSearchParams?.reason)
    ? resolvedSearchParams.reason[0]
    : resolvedSearchParams?.reason;
  const reasonMessage =
    reason === "inactive"
      ? "This account is not set up for active staff access."
      : undefined;

  if (session.status === "authenticated") {
    const homePath = session.context.role === "mechanic" ? "/portal/attendance" : "/dashboard";

    return (
      <LoginShell>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_32px_90px_rgba(6,27,61,0.22)] sm:p-8">
          <BrandMark />
          <div className="mt-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Session active
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              You&apos;re already signed in.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Continue to your assigned workspace or sign out if you need to switch staff
              accounts.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Button asChild variant="yellowPrimary" className="h-12 rounded-xl text-sm font-semibold uppercase tracking-[0.18em]">
              <Link href={homePath}>
                {session.context.role === "mechanic" ? "Go to attendance portal" : "Go to dashboard"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="outline"
                className="h-12 w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </LoginShell>
    );
  }

  return (
    <LoginShell showSecurityNote>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_32px_90px_rgba(6,27,61,0.22)] sm:p-8">
        <BrandMark />

        <div className="mt-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            SAY Auto Care portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Welcome Back
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Login to access your SAY Auto Care portal
          </p>
        </div>

        {reasonMessage ? (
          <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {reasonMessage}
          </div>
        ) : null}

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </LoginShell>
  );
}

function LoginShell({
  children,
  showSecurityNote = false,
}: {
  children: React.ReactNode;
  showSecurityNote?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-brand-navyStrong">
      <Image
        src={LOGIN_BACKGROUND_SRC}
        alt="SAY Auto Care login background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(4,15,35,0.9)_0%,rgba(6,27,61,0.76)_42%,rgba(4,15,35,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(215,25,32,0.18),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(6,27,61,0.26),transparent_28%)]" />
      <div className="absolute left-0 top-8 h-px w-32 rotate-[-34deg] bg-gradient-to-r from-transparent via-brand-red to-transparent opacity-90 sm:w-48 md:left-4 md:top-12 md:w-56" />
      <div className="absolute bottom-8 left-8 hidden h-px w-40 rotate-[28deg] bg-gradient-to-r from-transparent via-brand-red/80 to-transparent opacity-80 sm:block md:bottom-10 md:w-56" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-6 sm:pt-6 md:px-8 md:pb-8 md:pt-8 lg:px-10 lg:pb-8 lg:pt-8 xl:px-14">
        <section className="grid w-full flex-1 grid-rows-[auto_auto_1fr_auto] gap-y-6 md:grid-cols-[minmax(0,1fr)_minmax(360px,430px)] md:grid-rows-[auto_1fr_auto] md:gap-x-10 md:gap-y-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:grid-rows-[1fr_auto] lg:gap-x-12">
          <TabletTopBrand />
          <DesktopHeroPanel />
          <ResponsiveHeroCopy />

          <div className="self-start md:col-start-2 md:row-start-2 md:self-center md:justify-self-end lg:col-start-2 lg:row-start-1 lg:w-full lg:max-w-[460px]">
            <div className="mx-auto w-full max-w-[430px]">
              {children}
              {showSecurityNote ? <SecurityNote className="mt-5 hidden md:flex" /> : null}
            </div>
          </div>

          {showSecurityNote ? <SecurityNote className="mt-1 md:hidden" /> : null}

          <footer className="hidden border-t border-white/10 pt-5 text-xs text-white/68 md:col-span-2 md:row-start-3 md:flex md:items-center md:justify-between lg:col-span-2 lg:row-start-2">
            <p>© 2024 SAY Auto Care. All rights reserved.</p>
            <div className="flex items-center gap-4 text-white/62">
              <span>Privacy Policy</span>
              <span className="text-white/24">|</span>
              <span>Terms of Service</span>
              <span className="text-white/24">|</span>
              <span>Contact Support</span>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

function DesktopHeroPanel() {
  return (
    <section className="relative hidden lg:flex lg:min-h-0 lg:flex-col lg:justify-between lg:py-6 xl:py-8">
      <div>
        <div className="max-w-[460px]">
          <Image
            src={FULL_LOGO_SRC}
            alt="SAY Auto Care"
            width={1402}
            height={526}
            priority
            className="h-auto w-full object-contain drop-shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
          />
        </div>

        <div className="mt-14 max-w-[540px]">
          <div className="h-px w-24 bg-gradient-to-r from-brand-red via-brand-red/70 to-transparent" />
          <BrandHeadline className="mt-7 text-left text-6xl xl:text-7xl" />
          <BrandSupportCopy className="mt-6 max-w-[500px] text-left text-base leading-8 text-white/82 xl:text-lg" />
        </div>
      </div>

      <div className="mt-10 grid max-w-[560px] gap-3 sm:grid-cols-2">
        {HERO_FEATURES.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-white/[0.92] backdrop-blur-sm"
          >
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-red/[0.18] text-white">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/[0.52]">
                Feature
              </p>
              <p className="mt-1 text-sm font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TabletTopBrand() {
  return (
    <div className="lg:hidden md:col-span-2 md:row-start-1">
      <div className="mx-auto w-full max-w-[320px] md:max-w-[460px]">
        <Image
          src={FULL_LOGO_SRC}
          alt="SAY Auto Care"
          width={1402}
          height={526}
          priority
          className="h-auto w-full object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
        />
      </div>
    </div>
  );
}

function ResponsiveHeroCopy() {
  return (
    <section className="md:col-start-1 md:row-start-2 md:flex md:flex-col md:justify-center lg:hidden">
      <div className="mx-auto w-full max-w-[430px] text-center md:mx-0 md:max-w-[380px] md:text-left">
        <div className="mx-auto h-px w-20 bg-gradient-to-r from-transparent via-brand-red to-transparent md:mx-0 md:w-24 md:bg-gradient-to-r md:from-brand-red md:via-brand-red/70 md:to-transparent" />
        <BrandHeadline className="mt-6 text-center text-[2.3rem] md:text-left md:text-[2.75rem]" />
        <BrandSupportCopy className="mt-4 text-center text-base leading-7 text-white/82 md:max-w-[360px] md:text-left" />
      </div>
    </section>
  );
}

function BrandHeadline({ className = "" }: { className?: string }) {
  return (
    <h2
      className={`font-display uppercase leading-[0.94] tracking-[0.04em] text-white ${className}`.trim()}
    >
      Driven By <span className="text-brand-red">Precision.</span>
      <br />
      Built On <span className="text-brand-red">Trust.</span>
    </h2>
  );
}

function BrandSupportCopy({ className = "" }: { className?: string }) {
  return (
    <p className={className}>
      Professional auto care services you can count on. Quality. Reliability. Performance.
    </p>
  );
}

function SecurityNote({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-white/12 bg-brand-navy/88 px-4 py-4 text-white ${className}`.trim()}
    >
      <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
        <ShieldCheck className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">Your data is secure with us.</p>
        <p className="text-sm leading-6 text-white/78">
          All information is encrypted and protected.
        </p>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="mx-auto w-[72px]">
      <Image
        src={SHIELD_LOGO_SRC}
        alt="SAY Auto Care shield mark"
        width={904}
        height={1086}
        priority
        className="h-auto w-full object-contain drop-shadow-[0_10px_24px_rgba(6,27,61,0.10)]"
      />
    </div>
  );
}
