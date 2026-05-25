const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats USD for display using product dimensions convention (whole numbers preferred). */
export function formatUsd(value: number): string {
  return currency.format(value);
}

/** Formats a dimension value for dropdown labels. */
export function formatDimension(value: number): string {
  return String(value);
}
