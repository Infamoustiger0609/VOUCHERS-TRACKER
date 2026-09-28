"""E-Voucher dashboard data pipeline.

Reads the raw E-Codes workbook and the three Voucher Summary reports, applies
the agreed business rules, and writes clean JSON cubes to /data for the
dashboard layer to consume.

Run: python src/pipeline.py
"""
from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
ECODES_FILE = BASE_DIR / "E Codes 2025-2026..xlsx"
VOUCHER_FILES = [
    BASE_DIR / "Voucher_Summary_01 Jun to 31Dec'24.xlsx",
    BASE_DIR / "Voucher_Summary_01 Jan to Dec'25.xlsx",
    BASE_DIR / "Voucher_Summary_01 Jan to 31 Aug'26.xlsx",
]
OUT_DIR = BASE_DIR / "data"
TODAY = pd.Timestamp(pd.Timestamp.now().date())

ECODES_SHEETS = ["2024-2025", "2025-2026", "2026-2027"]

# Positional column map, A..AH (34 columns). Header text differs slightly
# across sheets ("Sr.No" vs "]" typo, "Scheme ID" vs "Scheme Code"), so we
# read by position and assign our own names rather than trusting headers.
ECODES_COLS = [
    "sr_no", "date", "scheme_code", "voucher_type", "offer", "vendor", "scheme_name",
    "issued_date", "validity_from", "validity_to", "valid_days", "capping_value",
    "category_raw", "discount_on_txn", "valid_on_cinema", "valid_for_movie",
    "redemption_mode", "e_code_nature", "no_of_e_code", "e_code_value", "total",
    "discount_offered_to_vendor", "discount_amount_po", "net_receivable",
    "payment_mode_raw", "payment_received_at", "nav_voucher_no", "po", "grn",
    "amend_no", "amend_date", "amend_desc", "amend_approved_by", "department",
]

CATEGORY_MAP = {
    "ticket": "Ticket",
    "tickets": "Ticket",
    "f&b": "F&B",
    "f&b - 50g small popcorn": "F&B",
    "f&&": "F&B",
    "fnb": "F&B",
    "tickets & f&b": "Ticket & F&B",
}

UPFRONT_MODES = {"neft", "advance", "credit", "payment received at mgf"}
ON_REDEMPTION_MODES = {
    "payment on redemption",
    "expense",
    "po/grn on redemptions",
    "po/grn",
    "billing on redemptions/approval",
    "neft/approval",
    "expense/po grn on redemption",
    "billing on redemptions",
    "approval",
    "payment on redemption , advance received 40 lacs",
    "payment on redemption rs. 50 per code",
    "50:50 funding, billing on redemption",
}

VOUCHER_COLS = [
    "company_name", "voucher_id", "voucher_desc", "status_raw", "start_date", "expiry_date",
    "outlet", "cash_card", "active", "inactive_date", "redemption_at", "sr_no_from", "sr_no_to",
    "discount_on", "discount", "issue_qty", "redeemed_qty", "redemption_amount",
    "forfeited_qty", "forfeited_amount",
]

SCHEME_OUTPUT_FIELDS = [
    "scheme_code", "vendor", "scheme_name", "category", "bucket", "payment_mode",
    "created_qty", "redeemed_qty", "redemption_amount", "recognized_amount",
    "pct_redeemed", "pace", "status", "validity_from", "validity_to",
    "e_code_nature", "no_of_e_code", "e_code_value", "total",
]

dq_log: list[dict] = []


def log_dq(stage: str, reason: str, **fields) -> None:
    dq_log.append({"stage": stage, "reason": reason, **fields})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_date_cell(x):
    """Dates in these sheets are a mix of real datetimes and text like
    'June 20, 2025' (Excel stored them as text in some rows)."""
    if x is None:
        return pd.NaT
    if isinstance(x, pd.Timestamp):
        return x
    if hasattr(x, "year") and hasattr(x, "month"):  # datetime.datetime/date
        return pd.Timestamp(x)
    if isinstance(x, str):
        s = x.strip()
        if not s:
            return pd.NaT
        return pd.to_datetime(s, errors="coerce")
    return pd.NaT


def parse_int_cell(x):
    """Parse a scheme code / voucher id cell to a clean int.

    Returns None for blanks and for values that aren't a single clean number
    (e.g. "13170 & 13171" - two codes combined in one text field).
    """
    if x is None:
        return None
    if isinstance(x, bool):
        return None
    if isinstance(x, int):
        return int(x)
    if isinstance(x, float):
        if math.isnan(x):
            return None
        return int(round(x))
    if isinstance(x, str):
        s = x.strip()
        if not s:
            return None
        try:
            return int(round(float(s)))
        except ValueError:
            return None
    return None


def safe_num(x):
    """Coerce to a JSON-safe number (int when whole, else float), or None."""
    if x is None:
        return None
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    if math.isnan(v) or math.isinf(v):
        return None
    if v == int(v):
        return int(v)
    return v


def clean_for_json(obj):
    """Recursively strip NaN/Inf/numpy/pandas types so json.dump never emits
    a literal NaN (invalid JSON for most consumers, including JS)."""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [clean_for_json(v) for v in obj]
    if obj is pd.NaT:
        return None
    if isinstance(obj, pd.Timestamp):
        return obj.strftime("%Y-%m-%d") if pd.notna(obj) else None
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, (np.floating, float)):
        v = float(obj)
        return None if (math.isnan(v) or math.isinf(v)) else v
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, str):
        return obj
    try:
        if pd.isna(obj):
            return None
    except (TypeError, ValueError):
        pass
    return obj


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(clean_for_json(data), f, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# STEP 1: E-Codes scheme table
# ---------------------------------------------------------------------------

def load_ecodes() -> pd.DataFrame:
    frames = []
    for sheet in ECODES_SHEETS:
        df = pd.read_excel(ECODES_FILE, sheet_name=sheet, header=None, skiprows=1)
        df = df.iloc[:, :34].copy()
        df.columns = ECODES_COLS
        df["sheet"] = sheet
        frames.append(df)
    df = pd.concat(frames, ignore_index=True)

    # drop fully blank trailer rows (e.g. trailing empty rows in 2025-2026)
    df = df.dropna(how="all", subset=["sr_no", "scheme_code", "voucher_type"]).reset_index(drop=True)

    df["date_parsed"] = df["date"].apply(parse_date_cell)
    df["validity_from_parsed"] = df["validity_from"].apply(parse_date_cell)
    df["validity_to_parsed"] = df["validity_to"].apply(parse_date_cell)

    # Filter 1: Voucher Type (col D) == "Showbiz" only.
    df = df[df["voucher_type"] == "Showbiz"].copy()

    # Filter 2: Date (col B) >= 2024-06-01.
    unparseable = df[df["date_parsed"].isna()]
    for _, r in unparseable.iterrows():
        log_dq("step1", "unparseable_date", sheet=r["sheet"], sr_no=r["sr_no"],
               scheme_code=r["scheme_code"], vendor=r["vendor"], detail=str(r["date"]))
    df = df[df["date_parsed"] >= pd.Timestamp("2024-06-01")].copy()

    # Filter 3: Department (col AH), trimmed, startswith "PVR Corporate Sales Team".
    df["department_trim"] = df["department"].apply(lambda x: x.strip() if isinstance(x, str) else x)
    df = df[df["department_trim"].apply(
        lambda x: isinstance(x, str) and x.startswith("PVR Corporate Sales Team")
    )].copy()

    # Filter 4: drop rows where Scheme Code is blank, except the one documented fix.
    def is_blank(v):
        if v is None:
            return True
        if isinstance(v, float) and math.isnan(v):
            return True
        if isinstance(v, str) and not v.strip():
            return True
        return False

    fix_mask = (df["sheet"] == "2026-2027") & (df["sr_no"] == 197) & df["scheme_code"].apply(is_blank)
    df.loc[fix_mask, "scheme_code"] = 15048

    blank_mask = df["scheme_code"].apply(is_blank)
    for _, r in df[blank_mask].iterrows():
        log_dq("step1", "blank_scheme_code", sheet=r["sheet"], sr_no=r["sr_no"],
               vendor=r["vendor"], scheme_name=r["scheme_name"])
    df = df[~blank_mask].copy()

    # Parse Scheme Code to a clean int; flag combined/unparseable codes
    # (e.g. "13170 & 13171") rather than guessing which one to keep.
    df["scheme_code_int"] = df["scheme_code"].apply(parse_int_cell)
    bad_code_mask = df["scheme_code_int"].isna()
    for _, r in df[bad_code_mask].iterrows():
        log_dq("step1", "unparseable_scheme_code", sheet=r["sheet"], sr_no=r["sr_no"],
               vendor=r["vendor"], scheme_name=r["scheme_name"], scheme_code_raw=str(r["scheme_code"]))
    df = df[~bad_code_mask].copy()
    df["scheme_code_int"] = df["scheme_code_int"].astype(int)

    # Filter 5: drop rows where Vendor or Scheme Name contains "test" (case-insensitive).
    def has_test(v):
        return isinstance(v, str) and "test" in v.lower()

    test_mask = df["vendor"].apply(has_test) | df["scheme_name"].apply(has_test)
    for _, r in df[test_mask].iterrows():
        log_dq("step1", "test_code", sheet=r["sheet"], sr_no=r["sr_no"], scheme_code=r["scheme_code_int"],
               vendor=r["vendor"], scheme_name=r["scheme_name"])
    df = df[~test_mask].copy()

    # Scheme codes that repeat within the final scoped table: tell an exact
    # duplicate (same Offer/Scheme Name/E-Code Value/Total/qty - one row is
    # just noise) from two distinct sub-offers that happen to reuse the same
    # code (e.g. the 13737 case) - only the former gets collapsed.
    def _dup_key(row):
        def norm_str(v):
            return v.strip().lower() if isinstance(v, str) else None

        def norm_num(v):
            n = safe_num(v)
            return n

        return (
            norm_str(row["offer"]),
            norm_str(row["scheme_name"]),
            norm_num(row["e_code_value"]),
            norm_num(row["total"]),
            norm_num(row["no_of_e_code"]),
        )

    dupe_counts = df["scheme_code_int"].value_counts()
    dupe_codes = set(dupe_counts[dupe_counts > 1].index)
    drop_indices = []
    for code in dupe_codes:
        rows = df[df["scheme_code_int"] == code]
        keys = [_dup_key(r) for _, r in rows.iterrows()]
        is_exact_dup = len(set(keys)) == 1

        if is_exact_dup:
            # identical data on every row - keep the first, drop the rest
            keep_idx = rows.index[0]
            for idx, r in rows.iterrows():
                if idx == keep_idx:
                    continue
                drop_indices.append(idx)
                log_dq(
                    "step1", "duplicate_scheme_code_dropped", sheet=r["sheet"], sr_no=r["sr_no"], scheme_code=code,
                    vendor=r["vendor"], scheme_name=r["scheme_name"],
                    detail="Exact duplicate row for this Scheme Code (same Offer/Scheme "
                           "Name/E-Code Value/Total/qty) - dropped, kept one copy.",
                )
        else:
            for _, r in rows.iterrows():
                log_dq(
                    "step1", "same code, distinct offers", sheet=r["sheet"], sr_no=r["sr_no"], scheme_code=code,
                    vendor=r["vendor"], scheme_name=r["scheme_name"],
                    detail=(
                        "Scheme Code appears more than once in the E-Codes source, but the "
                        "rows are distinct sub-offers (differ in Offer/Scheme Name/E-Code "
                        "Value/Total/qty), not duplicates - both kept. If this scheme is "
                        "bucketed as KOTAK/OFFERS, its redemption figures are looked up from "
                        "a single Voucher Summary row and will be duplicated across every "
                        "E-Codes row sharing this code."
                    ),
                )

    if drop_indices:
        df = df.drop(index=drop_indices).copy()

    # Normalize Category (col M) to Ticket / F&B / Ticket & F&B; anything else
    # is kept raw and flagged rather than guessed.
    def norm_category(v):
        if not isinstance(v, str):
            return None
        key = " ".join(v.strip().lower().split())
        return CATEGORY_MAP.get(key)

    df["category"] = df["category_raw"].apply(norm_category)
    unmapped_cat_mask = df["category"].isna() & df["category_raw"].notna()
    for _, r in df[unmapped_cat_mask].iterrows():
        log_dq("step1", "unmapped_category", sheet=r["sheet"], sr_no=r["sr_no"], scheme_code=r["scheme_code_int"],
               vendor=r["vendor"], scheme_name=r["scheme_name"], category_raw=r["category_raw"])
    df["category"] = df["category"].where(df["category"].notna(), df["category_raw"])

    # Normalize Payment Mode (col Y) into UPFRONT / ON_REDEMPTION groups.
    def norm_payment(v):
        return v.strip().lower() if isinstance(v, str) else None

    df["payment_mode_norm"] = df["payment_mode_raw"].apply(norm_payment)

    def payment_group(v):
        if v in UPFRONT_MODES:
            return "UPFRONT"
        if v in ON_REDEMPTION_MODES:
            return "ON_REDEMPTION"
        return "UNKNOWN"

    df["payment_group"] = df["payment_mode_norm"].apply(payment_group)
    unknown_mask = df["payment_group"] == "UNKNOWN"
    for _, r in df[unknown_mask].iterrows():
        print(f"WARNING: unmapped payment mode {r['payment_mode_raw']!r} "
              f"(scheme {r['scheme_code_int']}, {r['vendor']}) - not counted in NEFT or OFFERS")
        log_dq("step1", "unmapped_payment_mode", sheet=r["sheet"], sr_no=r["sr_no"], scheme_code=r["scheme_code_int"],
               vendor=r["vendor"], scheme_name=r["scheme_name"], payment_mode_raw=r["payment_mode_raw"])

    return df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# STEP 2: Voucher Summary redemption table
# ---------------------------------------------------------------------------

def load_voucher_summary() -> pd.DataFrame:
    frames = []
    for f in VOUCHER_FILES:
        df = pd.read_excel(f, header=None, skiprows=8)
        df = df.iloc[:, :20].copy()
        df.columns = VOUCHER_COLS
        df = df[df["company_name"] != "Grand Total :"]
        df["__file"] = f.name
        frames.append(df)
    df = pd.concat(frames, ignore_index=True)

    df["voucher_id_int"] = df["voucher_id"].apply(parse_int_cell)
    unparseable_id = df[df["voucher_id_int"].isna()]
    for _, r in unparseable_id.iterrows():
        log_dq("step2", "unparseable_voucher_id", file=r["__file"], voucher_id_raw=str(r["voucher_id"]))
    df = df.dropna(subset=["voucher_id_int"]).copy()
    df["voucher_id_int"] = df["voucher_id_int"].astype(int)

    # A Voucher ID appearing in more than one file has identical redemption
    # figures across files - keep one copy, doesn't matter which.
    df = df.drop_duplicates(subset=["voucher_id_int"], keep="first").copy()

    df["expiry_date_parsed"] = pd.to_datetime(df["expiry_date"], dayfirst=True, errors="coerce")
    bad_expiry = df[df["expiry_date_parsed"].isna()]
    for _, r in bad_expiry.iterrows():
        log_dq("step2", "unparseable_expiry_date", voucher_id=r["voucher_id_int"], detail=str(r["expiry_date"]))

    # Recompute Status ourselves - the file's own Status column is relative
    # to each report's query window, not real time.
    df["status"] = df["expiry_date_parsed"].apply(
        lambda d: "Active" if pd.notna(d) and d >= TODAY else "Expired"
    )

    df["issue_qty_int"] = pd.to_numeric(df["issue_qty"], errors="coerce").fillna(0).round().astype(int)
    df["redeemed_qty_int"] = pd.to_numeric(df["redeemed_qty"], errors="coerce").fillna(0).round().astype(int)
    df["redemption_amount_num"] = pd.to_numeric(df["redemption_amount"], errors="coerce").fillna(0.0)

    return df.reset_index(drop=True)


# ---------------------------------------------------------------------------
# STEP 3 + 4: join, per-scheme metrics, bucketing and recognized revenue
# ---------------------------------------------------------------------------

def compute_pace(status: str, pct_redeemed: float, vf: pd.Timestamp, vt: pd.Timestamp) -> str:
    if status == "Active":
        if pd.notna(vf) and pd.notna(vt) and vt > vf:
            elapsed_frac = (TODAY - vf).days / (vt - vf).days
            elapsed_frac = min(max(elapsed_frac, 0.0), 1.0)
            diff = pct_redeemed - elapsed_frac
            if diff > 0.05:
                return "Ahead"
            if diff < -0.05:
                return "Behind"
            return "On pace"
        return "On pace"
    return f"Expired · {round(pct_redeemed * 100, 1)}% util."


def build_schemes(ecodes: pd.DataFrame, vouchers: pd.DataFrame):
    v_by_id = vouchers.set_index("voucher_id_int")

    rows = []
    for _, r in ecodes.iterrows():
        code = int(r["scheme_code_int"])
        match = v_by_id.loc[code] if code in v_by_id.index else None
        if isinstance(match, pd.DataFrame):  # shouldn't happen post-dedup, but guard anyway
            match = match.iloc[0]

        if match is not None:
            created_qty = int(match["issue_qty_int"])
            redeemed_qty = int(match["redeemed_qty_int"])
            redemption_amount = float(match["redemption_amount_num"])
            status = match["status"]
        else:
            # No match in Voucher Summary = nothing was redeemed for this scheme.
            created_qty = 0
            redeemed_qty = 0
            redemption_amount = 0.0
            vt = r["validity_to_parsed"]
            status = "Active" if pd.notna(vt) and vt >= TODAY else "Expired"

        vendor = r["vendor"] if isinstance(r["vendor"], str) else ""
        is_kotak = "kotak" in vendor.lower()
        if is_kotak:
            bucket = "KOTAK"
        elif r["payment_group"] == "UPFRONT":
            bucket = "NEFT"
        elif r["payment_group"] == "ON_REDEMPTION":
            bucket = "OFFERS"
        else:
            bucket = "UNKNOWN"

        rows.append({
            "scheme_code": code,
            "sr_no": r["sr_no"],
            "sheet": r["sheet"],
            "vendor": r["vendor"],
            "scheme_name": r["scheme_name"],
            "category": r["category"],
            "bucket": bucket,
            "payment_mode": r["payment_mode_raw"],
            "created_qty": created_qty,
            "redeemed_qty": redeemed_qty,
            "redemption_amount": redemption_amount,
            "matched": match is not None,
            "status": status,
            "validity_from": r["validity_from_parsed"],
            "validity_to": r["validity_to_parsed"],
            "e_code_nature": r["e_code_nature"],
            "no_of_e_code": safe_num(r["no_of_e_code"]),
            "e_code_value": safe_num(r["e_code_value"]),
            "total": safe_num(r["total"]),
        })

    # --- Fix double-counted redemption on scheme codes that repeat in the
    # E-Codes source (real, distinct sub-offers sharing one code, flagged as
    # "same code, distinct offers"). All rows sharing a code join to the same
    # single Voucher Summary record, so redeemed_qty/redemption_amount would
    # otherwise be duplicated in full on every row. Only KOTAK/OFFERS rows
    # use these figures for recognized revenue (NEFT uses E-Codes' own
    # Total), so only KOTAK/OFFERS rows get split - proportionally by each
    # row's own NO.OF E-Code (the one field that actually differs between
    # the duplicate rows; the shared created_qty/redeemed_qty from Voucher
    # Summary is identical on every row in the group and can't be used as a
    # weight).
    split_info: list[dict] = []
    by_code: dict[int, list[dict]] = defaultdict(list)
    for row in rows:
        by_code[row["scheme_code"]].append(row)

    for code, group in by_code.items():
        if len(group) < 2:
            continue

        weights = [g["no_of_e_code"] or 0 for g in group]
        weight_sum = sum(weights)
        target_rows = [g for g in group if g["bucket"] in ("KOTAK", "OFFERS")]

        for g, w in zip(group, weights):
            vs_redeemed_qty = g["redeemed_qty"]
            vs_redemption_amount = g["redemption_amount"]
            entry = {
                "scheme_code": code,
                "sr_no": g["sr_no"],
                "sheet": g["sheet"],
                "voucher_summary_redeemed_qty": vs_redeemed_qty,
                "voucher_summary_redemption_amount": round(vs_redemption_amount, 2),
                "allocated_share": None,
                "split_applied": False,
            }

            if g["bucket"] in ("KOTAK", "OFFERS") and g["matched"]:
                if weight_sum > 0:
                    share = w / weight_sum
                else:
                    # NO.OF E-Code unavailable on either row - fall back to
                    # an even split across only the KOTAK/OFFERS rows.
                    share = 1 / len(target_rows)
                g["redeemed_qty"] = round(vs_redeemed_qty * share)
                g["redemption_amount"] = vs_redemption_amount * share
                entry["allocated_share"] = round(share, 4)
                entry["split_applied"] = True
            else:
                entry["note"] = (
                    "Not split - NEFT bucket recognizes revenue from E-Codes' own "
                    "Total column, not Voucher Summary redemption, so this row is "
                    "unaffected by the duplicate-code double-count."
                ) if g["bucket"] == "NEFT" else "Not split - no Voucher Summary match for this scheme code."

            split_info.append(entry)

    records = []
    for g in rows:
        created_qty = g["created_qty"]
        redeemed_qty = g["redeemed_qty"]
        redemption_amount = g["redemption_amount"]
        status = g["status"]
        vf, vt = g["validity_from"], g["validity_to"]

        pct_redeemed = (redeemed_qty / created_qty) if created_qty > 0 else 0.0
        pace = compute_pace(status, pct_redeemed, vf, vt)

        bucket = g["bucket"]
        if bucket in ("KOTAK", "OFFERS"):
            recognized_amount = redemption_amount
        elif bucket == "NEFT":
            recognized_amount = safe_num(g["total"]) or 0.0
        else:
            recognized_amount = 0.0

        # Recognized in the month of Validity From for every bucket (per
        # explicit confirmation - no +1 month shift for Credit).
        recognized_month = vf.strftime("%Y-%m") if pd.notna(vf) else None

        records.append({
            "scheme_code": g["scheme_code"],
            "vendor": g["vendor"],
            "scheme_name": g["scheme_name"],
            "category": g["category"],
            "bucket": bucket,
            "payment_mode": g["payment_mode"],
            "created_qty": created_qty,
            "redeemed_qty": redeemed_qty,
            "redemption_amount": round(redemption_amount, 2),
            "recognized_amount": round(recognized_amount, 2),
            "pct_redeemed": round(pct_redeemed, 4),
            "pace": pace,
            "status": status,
            "validity_from": vf.strftime("%Y-%m-%d") if pd.notna(vf) else None,
            "validity_to": vt.strftime("%Y-%m-%d") if pd.notna(vt) else None,
            "e_code_nature": g["e_code_nature"],
            "no_of_e_code": g["no_of_e_code"],
            "e_code_value": g["e_code_value"],
            "total": g["total"],
            # internal only, not part of the published schemes.json shape:
            "_recognized_month": recognized_month,
        })

    return records, split_info


def build_monthly_recognized(records: list[dict]) -> list[dict]:
    agg = defaultdict(lambda: {"neft": 0.0, "kotak": 0.0, "offers": 0.0})
    for r in records:
        month = r["_recognized_month"]
        if month is None:
            continue
        if r["bucket"] == "NEFT":
            agg[month]["neft"] += r["recognized_amount"]
        elif r["bucket"] == "KOTAK":
            agg[month]["kotak"] += r["recognized_amount"]
        elif r["bucket"] == "OFFERS":
            agg[month]["offers"] += r["recognized_amount"]
        # UNKNOWN bucket is excluded from the trend chart; it's flagged in
        # the data-quality log instead.

    return [
        {
            "month": month,
            "neft": round(agg[month]["neft"], 2),
            "kotak": round(agg[month]["kotak"], 2),
            "offers": round(agg[month]["offers"], 2),
        }
        for month in sorted(agg.keys())
    ]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def enrich_duplicate_split_log(split_info: list[dict]) -> None:
    """Fold the proportional-split audit trail into the existing
    "same code, distinct offers" entries logged during Step 1."""
    by_key = {(s["scheme_code"], s["sr_no"], s["sheet"]): s for s in split_info}
    for entry in dq_log:
        if entry.get("reason") != "same code, distinct offers":
            continue
        key = (entry.get("scheme_code"), entry.get("sr_no"), entry.get("sheet"))
        s = by_key.get(key)
        if s is None:
            continue
        entry["voucher_summary_redeemed_qty"] = s["voucher_summary_redeemed_qty"]
        entry["voucher_summary_redemption_amount"] = s["voucher_summary_redemption_amount"]
        entry["allocated_share"] = s["allocated_share"]
        entry["split_applied"] = s["split_applied"]
        if "note" in s:
            entry["split_note"] = s["note"]


def main() -> None:
    ecodes = load_ecodes()
    vouchers = load_voucher_summary()

    records, split_info = build_schemes(ecodes, vouchers)
    enrich_duplicate_split_log(split_info)
    monthly = build_monthly_recognized(records)

    schemes_out = [{k: r[k] for k in SCHEME_OUTPUT_FIELDS} for r in records]

    write_json(OUT_DIR / "schemes.json", schemes_out)
    write_json(OUT_DIR / "monthly_recognized.json", monthly)
    write_json(OUT_DIR / "dataquality_log.json", dq_log)

    print(f"schemes.json: {len(schemes_out)} schemes")
    print(f"monthly_recognized.json: {len(monthly)} months")
    print(f"dataquality_log.json: {len(dq_log)} flagged/dropped rows")

    bucket_counts = defaultdict(int)
    for r in records:
        bucket_counts[r["bucket"]] += 1
    print("Bucket breakdown:", dict(bucket_counts))


if __name__ == "__main__":
    main()
