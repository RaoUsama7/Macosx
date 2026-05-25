"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { PaginationMeta } from "@/types/brands";

export type PaginationProps = {
  /** Base path for links (`/` for home catalog). */
  basePath?: string;
  currentPage: PaginationMeta["page"];
  totalPages: PaginationMeta["totalPages"];
};

/** Pages to show around current page with ellipses. */
export function paginationItems(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const out: Array<number | "ellipsis"> = [1];

  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) out.push("ellipsis");
  for (let p = left; p <= right; p++) out.push(p);
  if (right < total - 1) out.push("ellipsis");

  out.push(total);
  return out;
}

export default function Pagination({
  basePath = "/",
  currentPage,
  totalPages,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const normalizedBase = basePath.endsWith("/")
    ? basePath.slice(0, -1) || ""
    : basePath;

  const hrefForPage = (p: number) => {
    if (normalizedBase === "" || normalizedBase === "/") {
      return p <= 1 ? "/" : `/?page=${p}`;
    }
    return p <= 1 ? normalizedBase : `${normalizedBase}?page=${p}`;
  };

  const prev = Math.max(1, currentPage - 1);
  const next = Math.min(totalPages, currentPage + 1);
  const items = paginationItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Brand pagination"
      className="mt-10 flex flex-col items-center gap-3"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <PaginationLink
          disabled={currentPage <= 1}
          href={hrefForPage(prev)}
          ariaLabel="Previous page"
        >
          <ChevronLeft />
          <span className="ml-1 hidden sm:inline">Previous</span>
        </PaginationLink>

        <ul className="flex flex-wrap items-center justify-center gap-1">
          {items.map((entry, idx) =>
            entry === "ellipsis" ? (
              <li
                key={`e-${idx}`}
                aria-hidden="true"
                className="inline-flex h-9 min-w-[2.25rem] items-center justify-center px-1 text-sm text-slate-400"
              >
                …
              </li>
            ) : (
              <li key={entry}>
                {entry === currentPage ? (
                  <span
                    aria-current="page"
                    className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white shadow-sm"
                  >
                    {entry}
                  </span>
                ) : (
                  <PaginationLink
                    href={hrefForPage(entry)}
                    ariaLabel={`Page ${entry}`}
                  >
                    {entry}
                  </PaginationLink>
                )}
              </li>
            ),
          )}
        </ul>

        <PaginationLink
          disabled={currentPage >= totalPages}
          href={hrefForPage(next)}
          ariaLabel="Next page"
        >
          <span className="mr-1 hidden sm:inline">Next</span>
          <ChevronRight />
        </PaginationLink>
      </div>

      <p className="text-xs text-slate-500">
        Page <span className="font-medium text-slate-700">{currentPage}</span>{" "}
        of <span className="font-medium text-slate-700">{totalPages}</span>
      </p>
    </nav>
  );
}

function PaginationLink(props: {
  href: string;
  disabled?: boolean;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const { href, disabled, ariaLabel, children } = props;
  const base =
    "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border px-3 text-sm font-medium transition";
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${base} cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300`}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      prefetch={false}
      scroll={false}
      href={href}
      aria-label={ariaLabel}
      className={`${base} border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900`}
    >
      {children}
    </Link>
  );
}

function ChevronLeft() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M12 6l-4 4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M8 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
