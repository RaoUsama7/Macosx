# Product Brand Selector

A take-home test app built with Next.js (App Router) that displays product brands as paginated cards. Each card lets the user choose a length and width combination and reveals the matching product SKU and exact price.

Data is read from a PostgreSQL `products` table that is loaded from the provided `perntesting_database.sql` dump.

---

## Tech stack

- **Next.js 15** (App Router) + React 19
- **TypeScript** (no `any` in application code)
- **Tailwind CSS** for styling
- **Prisma** ORM
- **PostgreSQL** as the database

---

## Features

- Grid of brand cards, **12 brands per page** (responsive: 1 / 2 / 3 / 4 columns).
- Each card shows:
  - Brand name
  - Price range across all of that brand's products (`$min - $max`)
  - Length dropdown (unique lengths for the brand)
  - Width dropdown (only widths that exist for the chosen length, disabled until length is selected)
  - Highlighted result panel with the matching **SKU** and **exact price**
  - Friendly fallbacks for incomplete selection or no matching product
- **Server-side pagination** over unique brands with natural ordering of brand names that end in digits (Brand-2 before Brand-10).
- REST-style API at `GET /api/brands?page=&limit=` returning a strongly typed JSON envelope.
- Loading skeletons and an error state with a retry action.
- Clean white UI, modern dropdowns with a custom chevron, soft card shadows.

---

## Database setup

The app expects a PostgreSQL database that contains a `products` table with the columns Prisma maps in [`prisma/schema.prisma`](prisma/schema.prisma):

| Column | Type             | Notes              |
|--------|------------------|--------------------|
| `sku`    | `text`           | Primary key        |
| `brand`  | `text`           | Indexed            |
| `length` | `integer`        |                    |
| `width`  | `integer`        |                    |
| `price`  | `numeric(18, 2)` | Two decimal places |

You can populate it from the test's `perntesting_database.sql` dump (recommended), or, if you do not have the dump, create the table with Prisma and add your own rows.

### Import the provided SQL dump

The take-home ships the dump as a nested archive `perntesting_database.sql.zip`. Follow these steps in order.

1. Extract the archive next to `package.json` so you have `perntesting_database.sql` in the project root:

   - Windows: right-click `perntesting_database.sql.zip` and choose Extract All, or run `tar -xf perntesting_database.sql.zip`
   - macOS / Linux: `unzip perntesting_database.sql.zip`

2. Create the database (Postgres must be running and `createdb` / `psql` must be on your `PATH`):

   ```bash
   createdb perntesting
   ```

3. Import the SQL dump as the `postgres` superuser (use whatever role has rights on your machine):

   ```bash
   psql -U postgres -d perntesting -f perntesting_database.sql
   ```

   You may also need `-h localhost` or a different port depending on your Postgres configuration.

4. Configure `.env` so Prisma points at the database you just created. Copy the example file (see [Environment variables](#environment-variables) for the full table) and set:

   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5432/perntesting"
   ```

   Replace `postgres` / `password` with your local credentials.

5. Verify the import populated the `products` table:

   ```bash
   psql -U postgres -d perntesting -c "SELECT COUNT(*) FROM products;"
   psql -U postgres -d perntesting -c "SELECT COUNT(DISTINCT brand) FROM products;"
   ```

   The first query is the total number of product SKUs; the second is the number of distinct brands, which is the value that drives pagination (`totalBrands` in the API).

Do not write a seed script: the SQL dump is the authoritative assignment data, and any synthetic seed would mask real-data behaviour. The repository intentionally has no `prisma/seed.ts`.

---

## Environment variables

Copy the example file and fill in your local connection string:

- macOS/Linux: `cp .env.example .env`
- Windows (cmd or PowerShell): `copy .env.example .env`

| Variable        | Required | Example                                                             | Description                                          |
|-----------------|----------|---------------------------------------------------------------------|------------------------------------------------------|
| `DATABASE_URL`  | yes      | `postgresql://postgres:password@localhost:5432/perntesting`         | PostgreSQL connection URL Prisma uses to read data. |

The value must point at the same database you restored the dump into.

---

## Installation

```bash
npm install
npx prisma generate
```

`npx prisma generate` is also wired into `postinstall`, so the first `npm install` already produces the Prisma Client. Re-run it after editing [`prisma/schema.prisma`](prisma/schema.prisma).

---

## Run the development server

```bash
npm run dev
```

Open <http://localhost:3000>. Use `?page=2`, etc., to navigate between pages of brands.

Available scripts:

| Script               | Purpose                                              |
|----------------------|------------------------------------------------------|
| `npm run dev`        | Start the Next.js dev server on port 3000            |
| `npm run build`      | Generate the Prisma Client and build for production  |
| `npm start`          | Run the production build                             |
| `npm run lint`       | Lint with `next lint` / ESLint                       |
| `npm run db:generate`| `prisma generate`                                    |
| `npm run db:push`    | `prisma db push` (only if you skip the SQL dump)     |
| `npm run db:migrate` | `prisma migrate dev` (only if you skip the SQL dump) |

After a full SQL restore you generally do **not** need `db:push` or `db:migrate` — the dump already defines the table.

---

## How pagination works

Pagination is based on **unique brands, not individual product rows**.

- The API endpoint is `GET /api/brands?page=<n>&limit=<n>`.
- `page` defaults to `1`, `limit` defaults to `12`, and `limit` is capped at `100`.
- The server selects `COUNT(DISTINCT brand)` for `totalBrands`, then `OFFSET` / `LIMIT` against the distinct brand list to produce one page.
- Brand ordering is "natural": if a brand name ends in digits, the trailing number is parsed and used as the primary sort key, so the order is `Brand-1, Brand-2, Brand-3, Brand-10` rather than the lexicographic `Brand-1, Brand-10, Brand-2`. Brands without trailing digits sort by name afterwards.
- The server clamps out-of-range pages back into the valid window and returns the effective `page` in the metadata, so the UI can never display a phantom page.

Example response:

```json
{
  "data": [
    {
      "brand": "Brand-1",
      "minPrice": 19.99,
      "maxPrice": 89.0,
      "products": [
        { "sku": "B1-72-36", "length": 72, "width": 36, "price": 19.99 },
        { "sku": "B1-96-48", "length": 96, "width": 48, "price": 89.0 }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "totalBrands": 50,
    "totalPages": 5
  }
}
```

The page reads from this endpoint via the typed frontend helper [`src/lib/api.ts`](src/lib/api.ts)'s `getBrands(page, limit, signal?)`, which validates the response with runtime type guards before returning a `BrandsApiResponse`.

---

## How brand card selection works

Each card receives one `BrandGroup` (`brand`, `minPrice`, `maxPrice`, `products`):

1. **Length dropdown** is populated with the unique sorted lengths from `products`.
2. **Width dropdown** is disabled until a length is chosen.
3. Once a length is chosen, the width dropdown only lists widths that exist with that length (`products.filter(p => p.length === selectedLength)`).
4. Changing the length resets the width selection.
5. After both dropdowns are filled, the card looks up the matching product (`products.find(p => p.length === l && p.width === w)`).
6. If found, it shows the SKU and exact price in a highlighted dark result panel.
7. If no matching product exists, a small fallback message replaces the result panel.
8. Dropdown values are coerced to numbers before comparison so the string-by-default `select` values match the numeric `length` / `width` fields correctly.

---

## Project layout

```
src/
  app/
    api/brands/route.ts   GET /api/brands handler
    layout.tsx            Root layout, metadata
    page.tsx              Home: header + Suspense + BrandsCatalog
    globals.css           Tailwind + base styles + .select-modern utility
  components/
    BrandsCatalog.tsx     Client: fetches via getBrands, owns loading/error
    BrandGrid.tsx         Responsive grid wrapper
    BrandCard.tsx         Brand card with length/width selectors
    Pagination.tsx        Numbered pagination with prev/next
    LoadingState.tsx      Skeleton cards
    ErrorState.tsx        Error panel with retry
  lib/
    api.ts                getBrands frontend helper + response guards
    products.ts           Server-side brand queries via Prisma
    prisma.ts             PrismaClient singleton
    format.ts             USD and dimension formatters
  types/
    brands.ts             Product, BrandGroup, PaginationMeta, BrandsApiResponse, BrandsApiError
prisma/
  schema.prisma           Product model -> PostgreSQL `products` table
```

---

## Implementation notes and decisions

- **Pagination is over distinct brands, not product rows.** The API performs `COUNT(DISTINCT brand)` plus a `DISTINCT brand` slice. The total page count is therefore the number of brands divided by `limit`.
- **Natural sort by trailing digits.** PostgreSQL's `regexp_match(brand, '[0-9]+$')::bigint` is used in the ordering clause so numeric suffixes sort correctly across pages.
- **Two-step query per page.** The server first selects the brand-name slice, then issues a `groupBy` for min/max prices and a `findMany` for the matching products. The results are bucketed by brand and returned in the same order as the slice so pagination remains deterministic.
- **One canonical type module.** [`src/types/brands.ts`](src/types/brands.ts) defines `Product`, `BrandGroup`, `PaginationMeta`, `BrandsApiResponse`, and `BrandsApiError`. The server, API route, frontend helper, and components all consume the same types. No `any` is used in application code.
- **Typed frontend client.** [`src/lib/api.ts`](src/lib/api.ts) exposes `getBrands(page, limit, signal?)`. It parses the JSON to `unknown`, runs type guards, and throws an `Error` with a useful message (server-provided when present) on failures, so UI code is not responsible for shape validation.
- **Server-side input validation.** The API route validates `page` and `limit` as positive integers with `limit <= 100` and returns `400` with a clear message for invalid input. Unexpected runtime errors return `500` with a generic message and are logged on the server.
- **Out-of-range pages are clamped.** Asking for `?page=999` when there are only 5 pages returns page 5 with `meta.page = 5`, so the UI shows real data and the correct active page.
- **Dropdown string-to-number safety.** `<select>` values are strings; the card converts them with `Number(...)` before comparing to the numeric `length` and `width` fields to prevent silent mismatches.
- **No fake seed data.** A seed script was intentionally removed so that the database state comes only from the provided SQL dump or whatever the developer loads manually.
- **Cache strategy.** The client fetcher uses `cache: "no-store"` so changes in the database appear immediately in the UI without manual revalidation; the homepage wraps the catalog in `Suspense` because `useSearchParams` is read inside the client component.
- **Accessibility / responsiveness.** Pagination uses `aria-current="page"`, the loading region has `aria-busy="true"`, errors use `role="alert"`, the grid is 1 / 2 / 3 / 4 columns from mobile through desktop, and Previous/Next labels collapse to chevron-only on small screens.

---

## Troubleshooting

- **`UNABLE_TO_VERIFY_LEAF_SIGNATURE` from npm.** This is a TLS / corporate proxy issue on the local machine; configure the proper certificate trust or proxy before re-running `npm install`.
- **Prisma cannot connect.** Confirm `DATABASE_URL` matches the database you imported into and that the Postgres server accepts the host, port, and role you set.
- **Empty grid.** Make sure the SQL dump finished without error and that the `products` table actually has rows: `psql -d perntesting -c "select count(*) from products;"`.
