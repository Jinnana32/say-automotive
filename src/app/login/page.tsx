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
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/96 p-6 shadow-[0_30px_80px_rgba(6,27,61,0.14)] backdrop-blur sm:p-8">
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
    <LoginShell>
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/96 p-6 shadow-[0_30px_80px_rgba(6,27,61,0.14)] backdrop-blur sm:p-8">
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

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-navy/[0.08] text-brand-navy">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Your data is secure with us.</p>
              <p className="text-sm leading-6 text-slate-600">
                All information is encrypted and protected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LoginShell>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#e9edf4_0%,#f7f8fb_42%,#eff2f7_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        <BrandHeroDesktop />

        <section className="relative flex min-h-screen flex-col justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 xl:px-14">
          <BrandHeroMobile />

          <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-6 lg:py-10">
            {children}
          </div>

          <footer className="mx-auto mt-6 w-full max-w-[460px] text-center text-xs text-slate-500">
            © 2024 SAY Auto Care. All rights reserved.
          </footer>
        </section>
      </div>
    </div>
  );
}

function BrandHeroDesktop() {
  return (
    <section className="relative hidden min-h-screen overflow-hidden lg:flex">
      <Image
        src={LOGIN_BACKGROUND_SRC}
        alt="SAY Auto Care login background"
        fill
        priority
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(4,15,35,0.94)_0%,rgba(6,27,61,0.82)_42%,rgba(6,27,61,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%),linear-gradient(180deg,rgba(215,25,32,0.18)_0%,transparent_20%,transparent_100%)]" />

      <div className="relative z-10 flex w-full flex-col justify-between px-12 py-12 xl:px-16 xl:py-14">
        <div>
          <div className="max-w-[420px]">
            <Image
              src={FULL_LOGO_SRC}
              alt="SAY Auto Care"
              width={1402}
              height={526}
              priority
              className="h-auto w-full object-contain drop-shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
            />
          </div>

          <div className="mt-12 max-w-[520px]">
            <div className="h-1 w-24 rounded-full bg-gradient-to-r from-brand-red via-red-300/70 to-transparent" />
            <h2 className="mt-6 font-display text-6xl uppercase leading-[0.92] tracking-[0.04em] text-white xl:text-7xl">
              Driven By Precision.
              <br />
              Built On Trust.
            </h2>
            <p className="mt-6 max-w-[480px] text-base leading-8 text-white/80 xl:text-lg">
              Professional auto care services you can count on. Quality. Reliability.
              Performance.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
      </div>
    </section>
  );
}

function BrandHeroMobile() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 lg:hidden">
      <Image
        src={LOGIN_BACKGROUND_SRC}
        alt="SAY Auto Care login background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(4,15,35,0.92)_0%,rgba(6,27,61,0.84)_55%,rgba(6,27,61,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_28%)]" />

      <div className="relative z-10 px-5 py-6 sm:px-6">
        <Image
          src={FULL_LOGO_SRC}
          alt="SAY Auto Care"
          width={1402}
          height={526}
          priority
          className="h-auto w-full max-w-[220px] object-contain"
        />
        <div className="mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-brand-red to-transparent" />
        <h2 className="mt-4 font-display text-3xl uppercase leading-[0.94] tracking-[0.04em] text-white sm:text-4xl">
          Driven By Precision.
          <br />
          Built On Trust.
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/[0.78]">
          Professional auto care services you can count on.
        </p>
      </div>
    </section>
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
