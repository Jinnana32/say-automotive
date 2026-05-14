"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DataTablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  startItem,
  endItem,
  pageParamName = "page",
  className,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  pageParamName?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalItems === 0) {
    return null;
  }

  const pageItems = getVisiblePages(page, totalPages);

  function buildHref(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage <= 1) {
      params.delete(pageParamName);
    } else {
      params.set(pageParamName, String(nextPage));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems} records
        {totalItems > pageSize ? ` · Page ${page} of ${totalPages}` : ""}
      </p>
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {page <= 1 ? (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={buildHref(page - 1)}>
                <ChevronLeft className="size-4" />
                Previous
              </Link>
            </Button>
          )}
          <div className="hidden items-center gap-2 sm:flex">
            {pageItems.map((pageItem, index) =>
              pageItem === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
                  <MoreHorizontal className="size-4" />
                </span>
              ) : (
                <Button
                  key={pageItem}
                  asChild
                  variant={pageItem === page ? "default" : "outline"}
                  size="sm"
                >
                  <Link href={buildHref(pageItem)}>{pageItem}</Link>
                </Button>
              ),
            )}
          </div>
          {page >= totalPages ? (
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={buildHref(page + 1)}>
                Next
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1) as Array<number | "ellipsis">;
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages] as Array<number | "ellipsis">;
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as Array<
      number | "ellipsis"
    >;
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ] as Array<number | "ellipsis">;
}
