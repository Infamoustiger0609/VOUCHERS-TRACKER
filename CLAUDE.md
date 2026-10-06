# CLAUDE.md

Guidance for Claude Code sessions working in this repo. See [README.md](README.md)
for setup/run commands - this file is about the business logic and conventions
you need to not break.

## What this is

A revenue dashboard for PVR Corporate Sales' E-Voucher schemes. `src/pipeline.py`
(Python) joins two source workbooks and writes clean JSON to `data/`; `web/`
(React) renders it. The pipeline is the source of truth for every number on
the dashboard - the dashboard does no business-logic computation of its own
beyond filtering/aggregating fields the pipeline already produced.

## Source of truth for business rules

**[RULES.txt](RULES.txt)** is the client's own words, given in several rounds
(the second half of the file is Q&A clarifying the first half). It is messy
but authoritative. `src/pipeline.py` has inline comments citing which rule
each block implements. If you're asked to change filtering, bucketing, or
revenue-recognition logic, read RULES.txt first and check whether the change
is consistent with it or contradicts it - if it contradicts, flag that to the
user rather than silently overriding a documented rule.

## Pipeline logic (`src/pipeline.py`)

Single-file, four stages, run via `python src/pipeline.py`:

1. **`load_ecodes()`** - reads all 3 sheets of the E-Codes workbook by
   *position*, not header text (headers differ slightly per sheet). Applies,
   in order: Voucher Type == "Showbiz" only; Date >= 2024-06-01; Department
   startswith "PVR Corporate Sales Team"; drops blank Scheme Codes (with one
   documented exception - a hardcoded fix for sr_no 197 in sheet 2026-2027);
   drops unparseable/combined Scheme Codes (e.g. "13170 & 13171"); drops
   Vendor/Scheme Name containing "test"; collapses exact-duplicate rows
   sharing a Scheme Code but keeps genuinely distinct sub-offers that happen
   to reuse a code (logged, and later proportionally split - see below).
2. **`load_voucher_summary()`** - reads the 3 redemption-report workbooks,
   dedupes by Voucher ID (a voucher appearing in multiple files has identical
   figures across files), and **recomputes Status itself** from expiry date
   vs. today rather than trusting each file's own Status column (which is
   relative to that report's query window, not real time).
3. **`build_schemes()`** - joins on Scheme Code == Voucher ID. Buckets every
   scheme into exactly one of:
   - **KOTAK** - vendor name contains "kotak" (any payment mode).
   - **NEFT** - payment mode is upfront (NEFT/Advance/Credit/"Payment
     received at MGF") and vendor isn't Kotak.
   - **OFFERS** - payment mode is on-redemption (Expense/Approval/PO-GRN/
     "Billing on Redemptions"/etc.) and vendor isn't Kotak.
   - **UNKNOWN** - payment mode doesn't match either known set. Excluded from
     the monthly trend chart and flagged in the data-quality log; if you see
     UNKNOWN schemes appear, the payment-mode string needs adding to
     `UPFRONT_MODES` or `ON_REDEMPTION_MODES` (after confirming with the
     user which group it belongs to - don't guess).

   Revenue recognition (`recognized_amount`): NEFT uses the E-Codes sheet's
   own **Total** column (recognized upfront, independent of redemption pace,
   confirmed no month-shift even for Credit). KOTAK and OFFERS use the actual
   **redemption_amount** from the matched Voucher Summary row. A scheme with
   no Voucher Summary match means nothing was redeemed - not a data error.
   Everything is recognized in the month of **Validity From** (confirmed as
   "the payment date" for this purpose).

   **Duplicate-code split**: when a Scheme Code legitimately repeats for
   distinct sub-offers (different Offer/Scheme Name/E-Code Value/Total/qty),
   all those rows join to the *same* Voucher Summary record, so redeemed
   qty/amount would be double-counted if used as-is. Only KOTAK/OFFERS rows
   depend on that figure (NEFT uses E-Codes' own Total, unaffected), so only
   KOTAK/OFFERS rows in the group get their share of redemption
   proportionally split by each row's own `no_of_e_code` weight (even split
   if weights are unavailable). The split's audit trail is folded back into
   the `dataquality_log.json` entry for that group.
4. **`build_monthly_recognized()`** - sums `recognized_amount` by bucket per
   month, for the Overview trend chart.

Output shape is intentionally narrow: `SCHEME_OUTPUT_FIELDS` in pipeline.py is
the whitelist of fields written to `schemes.json` - internal-only fields
(like `_recognized_month`) are stripped before writing.

## Data quality

`data/dataquality_log.json` is not an error log to silence - it's an audit
trail the pipeline is *supposed* to produce (blank scheme codes, dropped
duplicates, unparseable dates/codes, unmapped categories/payment modes). As
of the last pipeline run it holds 28 entries, all in expected categories,
with **zero UNKNOWN-bucket or unmapped-payment-mode entries** - i.e. current
source data is fully covered by the known rules. If a pipeline change causes
new categories of entries to appear here, that's a signal worth surfacing to
the user, not something to filter out.

## Dashboard conventions (`web/`)

- The dashboard is a pure consumer of `/data/*.json` (fetched via
  `useDashboardData.js`) - never add computation there that belongs in the
  pipeline (bucketing, recognition amounts, etc.). Filtering/aggregating
  already-computed fields for display is fine and is what the pages do.
- FY/Month multi-select filter state is shared across Overview and every
  bucket detail page via `lib/FilterContext.jsx` + `lib/useFyMonthFilter.js`,
  so behavior (dynamic month options per FY, reference-date resolution) stays
  identical everywhere. Reuse these hooks rather than reimplementing
  filtering on a new page.
- `CorporateSalesDetail.jsx` / `KotakDetail.jsx` / `OffersDetail.jsx` are thin
  wrappers around the shared `BucketDetailPage.jsx` - add bucket-specific
  behavior there via props, not by forking the component.
- Styling is inline `style={}` objects, dark theme, no CSS framework
  component library beyond Tailwind's utility layer in `index.css`. Match the
  existing style rather than introducing a new pattern.
- "Expiry & Risk" and "Data Health" are intentionally disabled stub routes
  (`Placeholder.jsx`, `DisabledNavItem` in `Sidebar.jsx`) for a later phase -
  don't build these out unless asked.

## Gotchas

- Source workbooks (`*.xlsx`) are gitignored (sensitive) but `data/*.json`
  **is** committed on purpose, so Vercel can build without the raw data - see
  [README.md](README.md#deployment). If you regenerate `data/`, remember it
  needs to be committed for the deployed site to pick it up.
- No `requirements.txt` for the Python side yet - `pandas`, `numpy`,
  `openpyxl` are the only deps, installed ad hoc.
- The E-Codes workbook is read by column *position*, not header name, because
  header text drifts slightly between sheets. If you add a new sheet/year,
  verify the 34-column positional layout still matches `ECODES_COLS` before
  trusting the output.
