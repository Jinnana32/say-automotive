import { requireAuthenticatedStaff } from "@/lib/auth/session";

export default async function QuickAccessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedStaff();

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
