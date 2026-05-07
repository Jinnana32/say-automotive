import Link from "next/link";

import { LoginForm } from "@/features/auth/components/login-form";
import { signOutAction } from "@/features/auth/actions/auth-actions";
import { getAppSessionState } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, resolvedSearchParams] = await Promise.all([
    getAppSessionState(),
    searchParams,
  ]);

  if (session.status === "authenticated") {
    return (
      <div className="min-h-screen bg-dashboard-grid px-4 py-12">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-border/80 bg-background/95 p-8 shadow-[0_24px_80px_rgba(14,34,61,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Session active</p>
          <h1 className="mt-3 font-display text-3xl tracking-[0.08em] text-foreground">
            Administration access is already active.
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Continue to the dashboard or sign out if you need to switch users.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
            >
              Go to dashboard
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const reason = Array.isArray(resolvedSearchParams?.reason)
    ? resolvedSearchParams.reason[0]
    : resolvedSearchParams?.reason;
  const reasonMessage =
    reason === "inactive"
      ? "This user is not linked to an active staff record."
      : undefined;

  return (
    <div className="min-h-screen bg-dashboard-grid px-4 py-12">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] bg-primary px-8 py-10 text-primary-foreground shadow-[0_24px_80px_rgba(14,34,61,0.18)]">
          <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/72">
            SAY Administration
          </p>
          <h1 className="mt-4 font-display text-4xl tracking-[0.08em]">
            Workshop operations access is now role-gated.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-primary-foreground/84">
            Sign in with a Supabase Auth user that is linked to an active staff record. Module
            access is controlled by the linked workshop role.
          </p>
        </section>

        <section className="rounded-[2rem] border border-border/80 bg-background/95 p-8 shadow-[0_24px_80px_rgba(14,34,61,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Authorized sign-in
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">Access the admin console</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use the staff-linked account issued for internal operations. Direct public access is
            blocked.
          </p>
          {reasonMessage ? (
            <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {reasonMessage}
            </div>
          ) : null}
          <div className="mt-8">
            <LoginForm />
          </div>
        </section>
      </div>
    </div>
  );
}
