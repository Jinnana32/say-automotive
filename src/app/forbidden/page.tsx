import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-dashboard-grid px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-border/80 bg-background/95 p-8 shadow-[0_24px_80px_rgba(14,34,61,0.08)]">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Access restricted
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          This role does not have access to that module.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The administration console now filters modules and server actions by staff role. If you
          need broader access, link the user to a different staff role or use an owner/admin
          account.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
