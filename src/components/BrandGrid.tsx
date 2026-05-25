import BrandCard from "@/components/BrandCard";
import type { BrandGroup } from "@/types/brands";

export type BrandGridProps = {
  brands: BrandGroup[];
};

export default function BrandGrid({ brands }: BrandGridProps) {
  if (brands.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center text-slate-600">
        <p className="text-sm font-medium text-slate-700">
          No brands in the catalog yet
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Once products are added you will see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {brands.map((item) => (
        <BrandCard key={item.brand} {...item} />
      ))}
    </div>
  );
}
