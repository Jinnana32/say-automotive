import { ArrowDown } from "lucide-react";

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
          A compact view of how quotations move through job orders and vehicle release.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {steps.map((step, index) => (
            <div key={step.label} className="flex flex-col items-stretch gap-2">
              <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 px-4 py-3.5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {step.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{step.count}</p>
                {step.helper ? (
                  <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{step.helper}</p>
                ) : null}
              </div>
              {index < steps.length - 1 ? (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
