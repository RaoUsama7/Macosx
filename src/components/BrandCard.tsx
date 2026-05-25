"use client";

import { useMemo, useState } from "react";
import type { BrandGroup, Product } from "@/types/brands";
import { formatDimension, formatUsd } from "@/lib/format";

function uniqueSortedNums(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

export type BrandCardProps = BrandGroup;

const SELECT_CLASS =
  "select-modern mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400";

const LABEL_CLASS =
  "block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";

export default function BrandCard({
  brand,
  minPrice,
  maxPrice,
  products,
}: BrandCardProps) {
  const lengths = useMemo(
    () => uniqueSortedNums(products.map((v) => v.length)),
    [products],
  );

  const [lengthChoice, setLengthChoice] = useState<string>("");
  const [widthChoice, setWidthChoice] = useState<string>("");

  /** Reset width synchronously when length changes to avoid a stale-selection render. */
  function handleLengthChange(next: string) {
    setLengthChoice(next);
    setWidthChoice("");
  }

  const widthsForLength = useMemo<number[]>(() => {
    if (!lengthChoice) return [];
    const len = Number(lengthChoice);
    return uniqueSortedNums(
      products.filter((v) => v.length === len).map((v) => v.width),
    );
  }, [products, lengthChoice]);

  const selected = useMemo<Product | undefined>(() => {
    if (!lengthChoice || !widthChoice) return undefined;
    const len = Number(lengthChoice);
    const wid = Number(widthChoice);
    return products.find((v) => v.length === len && v.width === wid);
  }, [products, lengthChoice, widthChoice]);

  const bothPicked = Boolean(lengthChoice && widthChoice);
  const sameRange = minPrice === maxPrice;
  const hasProducts = products.length > 0;

  return (
    <article className="group flex h-full min-h-[20rem] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Brand
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
          {brand}
        </h2>
        {hasProducts ? (
          <p className="mt-1 text-sm tabular-nums text-slate-600">
            {sameRange ? (
              <>Price: {formatUsd(minPrice)}</>
            ) : (
              <>
                {formatUsd(minPrice)} - {formatUsd(maxPrice)}
              </>
            )}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">No products available.</p>
        )}
      </div>

      {hasProducts ? (
        <>
          <div className="mt-5 space-y-3">
            <label className={LABEL_CLASS}>
              Length
              <select
                className={SELECT_CLASS}
                value={lengthChoice}
                onChange={(e) => handleLengthChange(e.target.value)}
              >
                <option value="">Select length</option>
                {lengths.map((len) => (
                  <option key={len} value={String(len)}>
                    {formatDimension(len)}
                  </option>
                ))}
              </select>
            </label>

            <label className={LABEL_CLASS}>
              Width
              <select
                className={SELECT_CLASS}
                value={widthChoice}
                disabled={!lengthChoice}
                onChange={(e) => setWidthChoice(e.target.value)}
              >
                <option value="">
                  {!lengthChoice ? "Select length first" : "Select width"}
                </option>
                {widthsForLength.map((w) => (
                  <option key={w} value={String(w)}>
                    {formatDimension(w)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-auto pt-5">
            {!bothPicked ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
                Choose length and width to see SKU and price.
              </div>
            ) : selected ? (
              <div className="rounded-lg bg-slate-900 px-4 py-3 text-white shadow-sm ring-1 ring-slate-900/10">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      SKU
                    </p>
                    <p className="mt-0.5 truncate font-mono text-sm">
                      {selected.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Price
                    </p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums">
                      {formatUsd(selected.price)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-center text-xs font-medium text-amber-800">
                No matching product for this length and width.
              </div>
            )}
          </div>
        </>
      ) : null}
    </article>
  );
}
