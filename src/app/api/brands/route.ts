import { NextRequest, NextResponse } from "next/server";
import { MAX_BRANDS_PAGE_LIMIT, getBrandsApiPage } from "@/lib/products";
import type { BrandsApiError, BrandsApiResponse } from "@/types/brands";

/**
 * Strict numeric parse: returns the integer, `fallback` when the input is missing,
 * or `NaN` for non-integer / non-numeric input (e.g. "12.5", "abc"). The caller
 * is expected to reject `NaN` with a 400 response.
 */
function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isInteger(n) ? n : NaN;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<BrandsApiResponse | BrandsApiError>> {
  const pageRaw = request.nextUrl.searchParams.get("page");
  const limitRaw = request.nextUrl.searchParams.get("limit");

  const pageParsed = parsePositiveInt(pageRaw, 1);
  const limitParsed = parsePositiveInt(limitRaw, 12);

  if (!Number.isInteger(pageParsed) || pageParsed < 1) {
    return NextResponse.json<BrandsApiError>(
      { error: "Invalid query: page must be a positive integer" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(limitParsed) || limitParsed < 1) {
    return NextResponse.json<BrandsApiError>(
      { error: "Invalid query: limit must be a positive integer" },
      { status: 400 },
    );
  }

  if (limitParsed > MAX_BRANDS_PAGE_LIMIT) {
    return NextResponse.json<BrandsApiError>(
      { error: `Invalid query: limit must be at most ${MAX_BRANDS_PAGE_LIMIT}` },
      { status: 400 },
    );
  }

  try {
    const body = await getBrandsApiPage(pageParsed, limitParsed);
    return NextResponse.json<BrandsApiResponse>(body, { status: 200 });
  } catch (err) {
    console.error("[GET /api/brands]", err);
    return NextResponse.json<BrandsApiError>(
      { error: "Failed to load brands" },
      { status: 500 },
    );
  }
}
