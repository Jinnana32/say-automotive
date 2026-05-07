"use client";

import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";

export function QuickAccessCustomerLookupForm({
  initialLastName,
  onLookupSubmitted,
}: {
  initialLastName: string;
  onLookupSubmitted?: () => void;
}) {
  const router = useRouter();
  const [lastNameInput, setLastNameInput] = useState(initialLastName);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitLookup(rawLastName: string) {
    const normalizedLastName = rawLastName.trim();

    if (!normalizedLastName) {
      setFormError("Enter a customer last name before searching.");
      return;
    }

    setFormError(null);
    onLookupSubmitted?.();
    startTransition(() => {
      router.push(`/quick-access?lastName=${encodeURIComponent(normalizedLastName)}`);
    });
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 md:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          submitLookup(lastNameInput);
        }}
      >
        <SearchInput
          value={lastNameInput}
          onChange={(event) => setLastNameInput(event.target.value)}
          placeholder="Enter customer last name"
          autoCorrect="off"
          spellCheck={false}
        />
        <Button type="submit" className="shrink-0" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Search customer
        </Button>
      </form>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      <p className="text-sm text-muted-foreground">
        Use the customer&apos;s surname to pull up linked vehicles, contact information, and recent
        quotation history.
      </p>
    </div>
  );
}
