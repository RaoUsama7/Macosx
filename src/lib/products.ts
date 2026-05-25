import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  BrandGroup,
  BrandsApiResponse,
  PaginationMeta,
} from "@/types/brands";

export const CARDS_PER_PAGE = 12;

/** Max `limit` for GET /api/brands (validated in route). */
export const MAX_BRANDS_PAGE_LIMIT = 100;

/**
 * Convert a Prisma `Decimal` to a plain JSON-safe number.
 * Uses `.toNumber()` (over `Number(value)`) so the intent is explicit and the
 * library is responsible for the formatting. `DECIMAL(18, 2)` price values
 * stay well within the safe-integer range of an IEEE-754 double.
 */
function decimalToNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

/** Total distinct brands (for pagination). */
export async function getDistinctBrandCount(): Promise<number> {
  const rows = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT brand)::bigint AS count FROM products
  `;
  return Number(rows[0].count);
}

/**
 * Ordered slice of distinct brand names:
 * trailing digits sort numerically (Brand-2 before Brand-10); others sort after by name.
 */
async function distinctBrandNamesNaturalOrderSlice(
  skip: number,
  take: number,
): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ brand: string }>>`
    SELECT brand
    FROM (
      SELECT DISTINCT brand
      FROM products
    ) d
    ORDER BY
      CASE
        WHEN brand ~ '[0-9]+$'
        THEN ((regexp_match(brand, '[0-9]+$'))[1])::bigint
      END ASC NULLS LAST,
      brand ASC
    OFFSET ${skip} LIMIT ${take}
  `;
  return rows.map((r) => r.brand);
}

async function buildBrandGroupsInOrder(
  brandNamesInOrder: string[],
): Promise<BrandGroup[]> {
  if (brandNamesInOrder.length === 0) return [];

  const aggregates = await prisma.product.groupBy({
    by: ["brand"],
    where: { brand: { in: brandNamesInOrder } },
    _min: { price: true },
    _max: { price: true },
  });

  const aggByBrand = new Map(aggregates.map((row) => [row.brand, row]));

  const productRows = await prisma.product.findMany({
    where: { brand: { in: brandNamesInOrder } },
    orderBy: [{ length: "asc" }, { width: "asc" }, { sku: "asc" }],
  });

  const productsByBrand = new Map<string, BrandGroup["products"]>();
  for (const name of brandNamesInOrder) {
    productsByBrand.set(name, []);
  }

  for (const p of productRows) {
    const bucket = productsByBrand.get(p.brand);
    if (!bucket) continue;
    bucket.push({
      sku: p.sku,
      length: p.length,
      width: p.width,
      price: decimalToNumber(p.price),
    });
  }

  return brandNamesInOrder.map((brand) => {
    const agg = aggByBrand.get(brand);
    return {
      brand,
      minPrice:
        agg?._min.price != null ? decimalToNumber(agg._min.price) : 0,
      maxPrice:
        agg?._max.price != null ? decimalToNumber(agg._max.price) : 0,
      products: productsByBrand.get(brand) ?? [],
    };
  });
}

/**
 * Loads one window of distinct brands with natural-ish ordering and clamps `page`.
 */
async function fetchBrandGroupsPaged(
  page: number,
  limit: number,
): Promise<{ groups: BrandGroup[]; meta: PaginationMeta }> {
  const totalBrands = await getDistinctBrandCount();
  const totalPages = totalBrands === 0 ? 0 : Math.ceil(totalBrands / limit);

  const effectivePage =
    totalPages === 0
      ? Math.max(1, page)
      : Math.min(Math.max(1, page), totalPages);

  const skip = (effectivePage - 1) * limit;
  const brandNames = await distinctBrandNamesNaturalOrderSlice(skip, limit);
  const groups = await buildBrandGroupsInOrder(brandNames);

  return {
    groups,
    meta: {
      page: effectivePage,
      limit,
      totalBrands,
      totalPages,
    },
  };
}

/** Server UI helper: paginated groups (12 per page default constant). */
export async function getBrandSummariesPage(
  page: number,
): Promise<BrandGroup[]> {
  const { groups } = await fetchBrandGroupsPaged(page, CARDS_PER_PAGE);
  return groups;
}

/** Full pagination result for SSR or API reuse. */
export async function getBrandCatalogPage(
  rawPage: number,
  limit = CARDS_PER_PAGE,
): Promise<{ groups: BrandGroup[]; meta: PaginationMeta }> {
  const page = Number.isFinite(rawPage)
    ? Math.max(1, Math.floor(rawPage))
    : 1;
  return fetchBrandGroupsPaged(page, limit);
}

/** Builds the GET /api/brands response body. */
export async function getBrandsApiPage(
  validatedPage: number,
  validatedLimit: number,
): Promise<BrandsApiResponse> {
  const { groups, meta } = await fetchBrandGroupsPaged(
    validatedPage,
    validatedLimit,
  );
  return { data: groups, meta };
}
