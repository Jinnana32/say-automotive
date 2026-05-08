import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkflowFunnelStep } from "@/features/reports/types";

export function WorkflowFunnel({
  steps,
}: {
  steps: WorkflowFunnelStep[];
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Workflow funnel</CardTitle>
        <CardDescription>
          A compact view of how quotations move through jobs, releases, and payment activity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 xl:grid-cols-[repeat(5,minmax(0,1fr))]">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="min-w-0 flex-1 rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {step.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{step.count}</p>
                {step.helper ? (
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">{step.helper}</p>
                ) : null}
              </div>
              {index < steps.length - 1 ? (
                <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground xl:block" />
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
