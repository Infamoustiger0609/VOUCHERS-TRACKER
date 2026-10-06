# E-Voucher Tracker

Corporate Sales revenue dashboard for PVR INOX's E-Voucher schemes. A Python
pipeline turns two messy internal Excel exports into clean JSON, and a React
dashboard reads that JSON to show recognized revenue by payment behaviour
(Corporate Sales / Kotak / Offers) with FY and month filters.

## How it fits together

```
E Codes 2025-2026..xlsx          Voucher_Summary_*.xlsx  (3 files, Jun'24-Aug'26)
  (scheme definitions)             (actual redemptions)
            \                        /
             \                      /
              v                    v
              src/pipeline.py  (python)
                      |
                      v
               data/*.json  (schemes, monthly_recognized, dataquality_log)
                      |
                      v  (npm run sync-data)
          web/public/data/*.json
                      |
                      v
          web/  React + Vite dashboard  (npm run dev / build)
```

The pipeline and the dashboard are decoupled: the dashboard only ever reads
`/data/*.json` as static files and has no idea how they were produced.

## Repo layout

- `E Codes 2025-2026..xlsx`, `Voucher_Summary_*.xlsx` - raw source workbooks.
  **Not committed** (gitignored, contain internal financial data) - you need
  your own copies locally to run the pipeline.
- `RULES.txt` - the business rules the pipeline implements, as dictated over
  several rounds of clarification. Read this before touching bucketing or
  revenue-recognition logic in `pipeline.py`.
- `src/pipeline.py` - the entire data pipeline (single file, see below).
- `data/` - pipeline output (`schemes.json`, `monthly_recognized.json`,
  `dataquality_log.json`). Committed to git deliberately - see
  [Deployment](#deployment).
- `web/` - the React dashboard (Vite, React 19, react-router, Recharts).

## Running the pipeline

Requires Python 3 with `pandas`, `numpy`, and `openpyxl` (no `requirements.txt`
yet - `pip install pandas numpy openpyxl` if you don't already have them).

```bash
python src/pipeline.py
```

Reads the 4 source workbooks from the repo root, applies the filters in
`RULES.txt`, and (re)writes the three files in `data/`. Prints a scheme count,
month count, data-quality flag count, and a bucket breakdown when it finishes.

Re-run it any time the source workbooks are updated with new months of data.

## Running the dashboard

```bash
cd web
npm install
npm run dev
```

`npm run dev` / `npm run build` both auto-run `sync-data` first (see
`package.json`), which copies `data/*.json` into `web/public/data/` so the
app can fetch them as static assets. You do not need to run `sync-data`
yourself, but you do need to have run the pipeline at least once so `/data`
exists.

## Deployment

Deployed on Vercel from this repo (private). Because the raw source workbooks
are gitignored, Vercel's build can't run the pipeline itself - so `data/*.json`
is committed to git (unlike the `.xlsx` sources) purely so `npm run build`
has something to sync into `web/public/data`. When the source data changes:
run the pipeline locally, commit the updated `data/*.json`, then push.

## Current status

The "By payment behaviour" section of the dashboard is fully live end to end:
Overview + detail pages for Corporate Sales, Kotak, and Offers, all sharing
FY/month filter state. "Expiry & Risk" and "Data Health" are stubbed nav items
for a later phase - not implemented yet.

See [CLAUDE.md](CLAUDE.md) for the business-logic details (bucketing,
revenue recognition, known data-quality quirks) and conventions for anyone
(human or Claude) working on this codebase.
