"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StaffPortalLoginSuccess({
  staffId,
  email,
  temporaryPassword,
}: {
  staffId: string;
  email: string;
  temporaryPassword: string;
}) {
  const router = useRouter();

  return (
    <Card className="border-emerald-200/80 bg-emerald-50/50 shadow-sm">
      <CardHeader>
        <CardTitle>Mechanic portal login created</CardTitle>
        <CardDescription>
          Share these credentials with the mechanic now. This temporary password is shown only once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200/80 bg-background px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Portal username
            </p>
            <p className="mt-2 font-mono text-sm font-semibold text-foreground">{email}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-background px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Temporary password
            </p>
            <p className="mt-2 font-mono text-sm font-semibold text-foreground">
              {temporaryPassword}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          The mechanic can sign in at the attendance portal using this email and password. They can
          change the password later from their profile if needed.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => router.push(`/staff/${staffId}/edit`)}>
            Open staff record
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/staff")}>
            Back to staff list
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
