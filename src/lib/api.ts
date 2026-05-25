import type {
  BrandGroup,
  BrandsApiError,
  BrandsApiResponse,
  PaginationMeta,
  Product,
} from "@/types/brands";

export type { BrandsApiResponse } from "@/types/brands";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProduct(value: unknown): value is Product {
  if (!isObject(value)) return false;
  return (
    typeof value.sku === "string" &&
    typeof value.length === "number" &&
    typeof value.width === "number" &&
    typeof value.price === "number"
  );
}

function isBrandGroup(value: unknown): value is BrandGroup {
  if (!isObject(value)) return false;
  return (
    typeof value.brand === "string" &&
    typeof value.minPrice === "number" &&
    typeof value.maxPrice === "number" &&
    Array.isArray(value.products) &&
    value.products.every(isProduct)
  );
}

function isPaginationMeta(value: unknown): value is PaginationMeta {
  if (!isObject(value)) return false;
  return (
    typeof value.page === "number" &&
    typeof value.limit === "number" &&
    typeof value.totalBrands === "number" &&
    typeof value.totalPages === "number"
  );
}

function isBrandsApiResponse(value: unknown): value is BrandsApiResponse {
  if (!isObject(value)) return false;
  return (
    Array.isArray(value.data) &&
    value.data.every(isBrandGroup) &&
    isPaginationMeta(value.meta)
  );
}

function isBrandsApiError(value: unknown): value is BrandsApiError {
  return isObject(value) && typeof value.error === "string";
}

/**
 * Frontend client for `GET /api/brands`.
 *
 * Throws an `Error` with a useful message when:
 * - the response body is not JSON,
 * - the server returns a non-OK status (uses the server's `error` field when present),
 * - or the JSON body does not match `BrandsApiResponse`.
 *
 * `AbortError`s from `signal` are not caught; callers can ignore them as usual.
 */
export async function getBrands(
  page: number,
  limit: number,
  signal?: AbortSignal,
): Promise<BrandsApiResponse> {
  const url = `/api/brands?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;

  const res = await fetch(url, { signal, cache: "no-store" });

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok) {
    const message = isBrandsApiError(parsed)
      ? parsed.error
      : `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (!isBrandsApiResponse(parsed)) {
    throw new Error("Unexpected response shape from server");
  }

  return parsed;
}
