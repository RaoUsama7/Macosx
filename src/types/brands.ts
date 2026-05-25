/**
 * Canonical brand/product types shared by the server lib, API route, and UI.
 * Wire and in-app shapes are intentionally the same so no boundary mapping is needed.
 */

export type Product = {
  sku: string;
  length: number;
  width: number;
  price: number;
};

export type BrandGroup = {
  brand: string;
  minPrice: number;
  maxPrice: number;
  products: Product[];
};

export type PaginationMeta = {
  page: number;
  limit: number;
  totalBrands: number;
  /** 0 when there are no brands. */
  totalPages: number;
};

export type BrandsApiResponse = {
  data: BrandGroup[];
  meta: PaginationMeta;
};

export type BrandsApiError = {
  error: string;
};
