# CLAUDE.md

Guidance for Claude Code sessions working in this repo. See [README.md](README.md)
for setup/run commands - this file is about the business logic and conventions
you need to not break.

## What this is

A revenue dashboard for PVR INOX Corporate Sales' E-Voucher schemes.
`src/pipeline.py` (Python) joins two kinds of source workbook and writes clean
JSON to `data/`; `web/` (React) renders it. The pipeline is the source of truth
for every number on the dashboard - the dashboard does no business-logic
computation of its own beyond filtering/aggregating fields the pipeline already
produced.

## Stack and commands

- **Pipeline**: `python src/pipeline.py` - reads the 4 raw `.xlsx` files in the
  repo root and writes `data/schemes.json`, `data/monthly_recognized.json`,
  `data/dataquality_log.json`. Deps: `pandas`, `numpy`, `openpyxl` (no
  `requirements.txt` yet).
- **Web**: React 19 + Vite + Tailwind v4 + Recharts + react-router.
  `cd web && npm install && npm run dev`. `predev`/`prebuild` run
  `scripts/sync-data.mjs`, which copies `data/*.json` into `web/public/data/`.
  `npm run lint` runs oxlint.
- **Deploy**: Vercel, from `main`, root directory `web`.

## Source of truth for business rules

**[RULES.txt](RULES.txt)** is the client's own words, given in several rounds
(the second half of the file is Q&A clarifying the first half). It is messy
but authoritative. `src/pipeline.py` has inline comments citing which rule
each block implements. If you're asked to change filtering, bucketing, or
revenue-recognition logic, read RULES.txt first and check whether the change
is consistent with it or contradicts it - if it contradicts, flag that to the
user rather than silently overriding a documented rule. Don't change data
rules without asking.

## Pipeline logic (`src/pipeline.py`)

Single-file, four stages:

1. **`load_ecodes()`** - reads sheets `2024-2025`, `2025-2026`, `2026-2027`
   (only these) of the E-Codes workbook by *position*, not header text
   (headers differ slightly per sheet). Applies, in order:
   - Voucher Type == "Showbiz" only.
   - Date >= 2024-06-01.
   - Department startswith "PVR Corporate Sales Team" - all variants count,
     including "... | Not to Include" (client confirmed).
   - Drops blank Scheme Codes, except the documented fix: sheet 2026-2027
     Sr.No 197 -> Scheme Code 15048 (hardcoded).
   - Drops unparseable/combined Scheme Codes (e.g. "13170 & 13171").
   - Drops test codes: Vendor/Scheme Name containing "test" (catches Sr.No
     597 in 2025-2026).
   - Collapses exact-duplicate rows sharing a Scheme Code but keeps genuinely
     distinct sub-offers that reuse a code (logged, later split - see below).
   - Normalizes Category (column M, "Valid Against") to Ticket / F&B /
     Ticket & F&B via `CATEGORY_MAP`; unmapped values are kept raw and logged.

   Every drop is logged to `dataquality_log.json`.
2. **`load_voucher_summary()`** - reads the 3 Voucher Summary (redemption
   report) workbooks. They overlap, so it dedupes by Voucher ID (overlapping
   rows have identical figures). It **ignores the files' Status column** and
   recomputes Active/Expired from expiry date vs. today (the file's Status is
   relative to that report's query window, not real time).
3. **`build_schemes()`** - joins on Scheme Code == Voucher ID. Buckets every
   scheme into exactly one of, in precedence order:
   - **KOTAK** - vendor name contains "kotak" (any payment mode).
   - **NEFT** (shown as "Corporate Sales") - payment mode in `UPFRONT_MODES`:
     NEFT / Advance / Credit / "Payment received at MGF".
   - **OFFERS** - payment mode in `ON_REDEMPTION_MODES` (Expense / Approval /
     PO-GRN / "Billing on Redemptions" / combo free-text variants).
   - **UNKNOWN** - payment mode matches neither set. Printed as a WARNING,
     logged, excluded from the monthly trend. Never default an unknown mode
     into a bucket - confirm with the user which set it belongs to, then add
     it to `UPFRONT_MODES` or `ON_REDEMPTION_MODES`.

   Revenue recognition (`recognized_amount`): NEFT uses the E-Codes sheet's
   own **Total** column (upfront money, independent of redemption). KOTAK and
   OFFERS use the actual **redemption_amount** from the matched Voucher
   Summary row. A scheme with no Voucher Summary match means nothing was
   redeemed - not a data error. Everything is recognized in the month of
   **Validity From** (confirmed as "the payment date"; no +1 month shift for
   Credit). Net Receivable and other reference-only E-Codes columns are never
   used or shown.

   **Duplicate-code split**: when a Scheme Code legitimately repeats for
   distinct sub-offers, all those rows join to the *same* Voucher Summary
   record, so redeemed qty/amount would be double-counted. Only KOTAK/OFFERS
   rows depend on that figure, so only they get their share split
   proportionally by each row's own created qty (`no_of_e_code`), or evenly
   if weights are unavailable. The split audit trail is folded back into the
   `dataquality_log.json` entry for that group.
4. **`build_monthly_recognized()`** - sums `recognized_amount` by bucket per
   month, for the Overview sparklines.

Output shape is intentionally narrow: `SCHEME_OUTPUT_FIELDS` in pipeline.py is
the whitelist of fields written to `schemes.json` - internal-only fields
(like `_recognized_month`) are stripped before writing.

## Data quality

`data/dataquality_log.json` is not an error log to silence - it's an audit
trail the pipeline is *supposed* to produce. As of the last pipeline run it
holds 28 entries, all expected: 16 `blank_scheme_code`, 1
`unparseable_scheme_code`, 1 `test_code`, 10 `same code, distinct offers`.
There are **zero unmapped-payment-mode or unmapped-category entries** - current
source data is fully covered by the known rules. If a pipeline change causes
new kinds of entries to appear here, surface it to the user rather than
filtering it out.

Current output: 831 schemes (NEFT 663, KOTAK 74, OFFERS 94).

When verifying numbers, check them independently against the raw data and
flag mismatches rather than assuming the pipeline or dashboard is right.

## Dashboard conventions (`web/`)

- The dashboard is a pure consumer of `/data/*.json` (fetched via
  `lib/useDashboardData.js`) - never add computation there that belongs in
  the pipeline (bucketing, recognition amounts, etc.). Filtering/aggregating
  already-computed fields for display is fine and is what the pages do.
- **Naming**: the NEFT bucket is labelled "Corporate Sales" (route
  `/corporate-sales`); the internal bucket key stays `NEFT`. The money figure
  is called "Revenue" everywhere.
- **Number formatting**: always use `formatCurrency` / `formatQty` /
  `formatPercent` from `lib/format.js`. Money in Lakhs (`₹X L`), below 1 lakh
  in K (`₹X K`); no decimals anywhere.
- **FY / Month filters**: FY = 1 Apr - 31 Mar ("2024-25"), and both FY and
  Month derive from `validity_from` via the helpers in `lib/fiscalYear.js`
  (string-based, timezone-safe) - don't re-derive dates elsewhere. Month
  values are `"YYYY-MM"` keys. Selection model lives in `lib/multiSelect.js`:
  `[]` = All, explicit array = exactly those, `NONE_SELECTED` = zero rows.
  Tapping an option from All selects all-but-that-one; a full array
  normalizes to `[]`, an emptied one to `NONE_SELECTED`; the All row toggles
  All <-> None. Month options only cover the selected FY(s): plain names in
  April -> March order for one FY, "Jun '24" labels otherwise. Changing FY
  prunes invalid months (an emptied month selection resets to `[]`).
  State is shared in memory across Overview and every bucket page via
  `lib/FilterContext.jsx` + `lib/useFyMonthFilter.js`; always pass the hook
  the **full** scheme list (not a bucket slice) so the shared selection
  means the same thing on every page. A hard reload resets to All. The
  Payment Mode filter is Overview-only.
- `CorporateSalesDetail.jsx` / `KotakDetail.jsx` / `OffersDetail.jsx` are thin
  wrappers around the shared `BucketDetailPage.jsx` - add bucket-specific
  behavior there via props, not by forking the component.
- **Styling**: inline `style={}` objects referencing CSS variables. Light
  theme (warm "executive" palette); all colors/fonts are tokens in
  `web/src/index.css` `:root` - use `var(--x)`, don't hardcode hex, and don't
  redesign. Tailwind is imported but no utility classes are used - the only
  `className`s are the shared helpers in `index.css` (`eh-card`,
  `eh-nav-item`, `num`, `disp`).
- **Layout**: left collapsible sidebar (collapsed state in localStorage). App
  shell uses `100dvh`; no fixed pixel page heights. Check layout in a real
  maximized browser window, not a fixed devtools viewport.
- Built pages: Overview, Corporate Sales, Kotak, Offers. "Expiry & Risk" and
  "Data Health" are intentionally disabled stubs (`Placeholder.jsx`,
  `DisabledNavItem` in `Sidebar.jsx`) for a later phase - don't build these
  out unless asked.

## Gotchas

- Source workbooks (`*.xlsx`) are gitignored (sensitive) - never commit them.
  `data/*.json` **is** committed on purpose, so Vercel can build without the
  raw data - see [README.md](README.md#deployment). If you regenerate
  `data/`, it needs to be committed for the deployed site to pick it up.
- The E-Codes workbook is read by column *position*, not header name, because
  header text drifts slightly between sheets. If you add a new sheet/year,
  verify the 34-column positional layout still matches `ECODES_COLS` before
  trusting the output.
- **Open question - month cut-off**: RULES.txt says to include data only up
  to August 2026 until full September data arrives, but the pipeline has no
  cut-off. The current output includes 37 schemes with Validity From in
  2026-09 (24 NEFT, about ₹27 L of revenue), and the trend runs to 2026-09.
  Confirm with the user before adding or removing a cut-off.
