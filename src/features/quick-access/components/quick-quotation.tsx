'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickQuotation() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="bluePrimary"
      size="pill"
      onClick={() => {
        router.push('/quotations/new');
      }}
      className="fixed bottom-20 right-6 z-40 shadow-2xl shadow-slate-950/25"
    >
      <Plus className="size-4" />
      New Quotation
    </Button>
  );
}
