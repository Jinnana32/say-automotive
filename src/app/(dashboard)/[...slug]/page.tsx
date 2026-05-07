import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD_NAV_ITEMS } from "@/lib/navigation";

type RoutePageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function PlannedModulePage({ params }: RoutePageProps) {
  const { slug } = await params;
  const path = `/${slug.join("/")}`;
  const matchedModule = DASHBOARD_NAV_ITEMS.find((item) => item.href === path);

  if (!matchedModule) {
    notFound();
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge variant="outline">Planned module</Badge>
          <Badge variant="secondary">Phase delivery</Badge>
        </div>
        <CardTitle className="pt-2 font-display text-3xl">{matchedModule.label}</CardTitle>
        <CardDescription>
          This route is scaffolded and ready for feature implementation in a later phase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-3xl text-sm text-muted-foreground">
          The foundation layer is in place so this module can be built into the shared app shell,
          feature-based source structure, and Supabase-backed workflow without restructuring later.
        </p>
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
          <p className="text-sm font-medium">Suggested next step</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Implement the feature slice under <code>src/features</code> and connect it to the
            corresponding transactional database flows before polishing the UI.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
