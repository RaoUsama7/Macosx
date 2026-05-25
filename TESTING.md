# Manual testing checklist

Use this checklist to verify the Product Brand Selector after `npm install`, importing `perntesting_database.sql`, and `npm run dev`. Open the app at <http://localhost:3000> in a desktop browser unless a step says otherwise.

> Tip: keep the browser DevTools console and Network tab open so you can spot errors and confirm that calls to `/api/brands` succeed.

---

## 1. App loads without errors

- [ ] Visiting <http://localhost:3000> returns a fully rendered page (no white screen).
- [ ] The header shows the title **"Product Brand Selector"** and the subtitle "Select available length and width combinations to view the matching SKU and price."
- [ ] The browser console has no red errors or unhandled-promise warnings.
- [ ] The Network tab shows `GET /api/brands?page=1&limit=12` returning **200**.
- [ ] The terminal running `npm run dev` shows no Prisma or Next.js runtime errors.

## 2. 12 brand cards show per page

- [ ] On a desktop viewport the first page renders exactly **12 brand cards** (unless the database has fewer brands total — verify with `psql -d perntesting -c "select count(distinct brand) from products;"`).
- [ ] The API response payload for page 1 contains `meta.limit === 12` and `data.length <= 12`.
- [ ] Navigating to `/?page=2` (or clicking the page-2 button) loads the next 12 brands, not products.

## 3. Pagination Previous / Next works

- [ ] On page 1, the **Previous** button is visually disabled and clicking it has no effect.
- [ ] On page 1, clicking **Next** advances to page 2 and the URL becomes `/?page=2`.
- [ ] On a middle page, clicking **Previous** moves back exactly one page.
- [ ] On the last page, **Next** is disabled and clicking it has no effect.
- [ ] The browser back/forward buttons restore the previous page selection.

## 4. Page numbers work

- [ ] The numbered buttons reflect the total number of pages (e.g. 1, 2, 3, …, 5 when there are 5 pages).
- [ ] Clicking a numbered button loads the matching page and updates the URL `?page=` value.
- [ ] The active page button is visually highlighted (dark background, white text) and has `aria-current="page"`.
- [ ] When there are many pages, ellipses (`…`) appear between distant page numbers and the current page is always visible in the list.
- [ ] Visiting an out-of-range page (e.g. `/?page=9999`) loads the last real page and the active button matches the clamped page; no empty grid is shown.

## 5. Each card shows a unique brand

- [ ] No two cards on the same page show the same brand name.
- [ ] Brands ending in numbers sort numerically (e.g. **Brand-1, Brand-2, Brand-10**) rather than lexically (**Brand-1, Brand-10, Brand-2**).
- [ ] No brand appears on more than one page (manually compare a few brand names between page 1 and page 2).

## 6. Length dropdown contains only available lengths for that brand

- [ ] Open a brand card and click the **Length** dropdown.
- [ ] The list shows every unique length that brand offers, sorted ascending.
- [ ] No length appears that is not present for that brand (cross-check with `psql -d perntesting -c "select distinct length from products where brand = '<brand>' order by length;"`).
- [ ] The list contains no duplicates.

## 7. Width dropdown is disabled before length selection

- [ ] When a card first appears, the **Width** dropdown is greyed out and cannot be opened.
- [ ] Its placeholder reads **"Select length first"**.
- [ ] After choosing a length, the placeholder changes to **"Select width"** and the dropdown becomes interactive.

## 8. Width dropdown only shows widths for the selected length

- [ ] Pick a length on a card; open the **Width** dropdown.
- [ ] The widths listed exist for that brand at the chosen length (cross-check with `psql -d perntesting -c "select distinct width from products where brand='<brand>' and length=<length> order by width;"`).
- [ ] Switch to a different length and reopen the **Width** dropdown — the options reflect the new length and may differ from before.
- [ ] No width appears that does not belong to the selected `(brand, length)` combination.

## 9. Changing length resets width

- [ ] Choose a length, then a width, and confirm the SKU/price panel shows a result.
- [ ] Now change the **Length** to a different value.
- [ ] The **Width** dropdown returns to its placeholder state (no selection) and the SKU/price panel is replaced by the "Choose length and width to see SKU and price." prompt.

## 10. Selecting length and width shows correct SKU and price

- [ ] Pick a `(length, width)` pair that exists for the brand.
- [ ] The dark result panel appears with **SKU** and **PRICE** labels.
- [ ] The SKU matches the database row for that `(brand, length, width)` (cross-check with `psql -d perntesting -c "select sku, price from products where brand='<brand>' and length=<length> and width=<width>;"`).
- [ ] The displayed price equals that row's price formatted as USD with two decimals (e.g. `$129.99`).
- [ ] If you reach a `(length, width)` combination that does not exist (only possible if the data is inconsistent), the panel shows the amber **"No matching product for this length and width."** message instead of crashing.

## 11. Price range is correct per brand

- [ ] On each card the range under the brand name reads `$min - $max`.
- [ ] Pick the lowest length/width combination and confirm the displayed exact price equals the range's left value when that variant is the cheapest (cross-check with `psql -d perntesting -c "select min(price), max(price) from products where brand='<brand>';"`).
- [ ] Pick the most expensive combination and confirm it equals the right value of the range.
- [ ] If a brand has a single product, the card shows `Price: $X.XX` instead of a range.

## 12. Mobile responsive layout works

Use Chrome / Firefox device emulator or a real device.

- [ ] At **≤640 px** (mobile) the grid is **1 card per row**, the header text scales down, and the Previous / Next buttons collapse to chevron-only icons.
- [ ] At **641–1023 px** (tablet) the grid is **2 cards per row**.
- [ ] At **1024–1279 px** (small desktop) the grid is **3 cards per row**.
- [ ] At **≥1280 px** (large desktop) the grid is **4 cards per row**.
- [ ] Dropdowns are full-width inside each card on every breakpoint and remain tap-friendly on touch devices.
- [ ] No horizontal scroll bar appears on any viewport width.

---

## Extra (optional) checks

These are not required by the task spec but worth running:

- [ ] **Loading state:** with the network throttled to "Slow 3G", a skeleton grid of 12 placeholders is briefly visible before cards render.
- [ ] **Error state:** stop the database, click **Try again** in the error panel, then restart the database and click **Try again** once more — the grid recovers without a page reload.
- [ ] **API contract:**
  - `curl "http://localhost:3000/api/brands?page=1&limit=12"` returns `{ data: [...], meta: { page, limit, totalBrands, totalPages } }`.
  - `curl "http://localhost:3000/api/brands?page=0"` returns **400** with `{ "error": "Invalid query: page must be a positive integer" }`.
  - `curl "http://localhost:3000/api/brands?limit=999"` returns **400** with a message about the `limit` cap.
- [ ] **Accessibility:** the pagination region announces "Brand pagination", the loading region is marked `aria-busy="true"`, and the error state is announced as a `role="alert"`.
