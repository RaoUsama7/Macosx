import { Suspense } from "react";
import BrandsCatalog from "@/components/BrandsCatalog";
import LoadingState from "@/components/LoadingState";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Catalog
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Product Brand Selector
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Select available length and width combinations to view the matching
            SKU and price.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<LoadingState />}>
          <BrandsCatalog />
        </Suspense>
      </main>
    </div>
  );
}
