# Scope and Anomaly Log

### Anomaly Detectors Implemented
1. **NUMBER_FORMAT**: Detects commas in amounts (e.g. "1,200") and strips them. (AUTO_RESOLVED)
2. **WHITESPACE**: Trims leading/trailing whitespace in amounts or names. (AUTO_RESOLVED)
3. **PRECISION_ROUNDING**: Rounds amounts to 2 decimals using round half up. (AUTO_RESOLVED)
4. **DATE_FORMAT**: Normalizes dates into ISO (`YYYY-MM-DD`). Infers year for "Mon DD". (AUTO_RESOLVED)
5. **DATE_AMBIGUOUS**: Flags dates like "04/05/2026" that could be DD/MM or MM/DD, resolving chronologically based on file context but marking for review. (PENDING_APPROVAL)
6. **NAME_NORMALIZATION**: Fuzzy-matches names to canonical Users. (AUTO_RESOLVED if score >80, else PENDING_APPROVAL)
7. **MISSING_PAYER**: Empty `paid_by` field sets payer to NULL and excludes from paid aggregations. (PENDING_APPROVAL)
8. **MISSING_CURRENCY**: Empty currency defaults to INR. (AUTO_RESOLVED)
9. **CURRENCY_CONVERSION**: Converts USD to INR at a fixed config rate. (AUTO_RESOLVED)
10. **NEGATIVE_AMOUNT**: Treats negative amounts as credits/refunds, imported standalone. (PENDING_APPROVAL)
11. **ZERO_AMOUNT**: Imports 0 amount as a valid zero-value expense. (AUTO_RESOLVED)
12. **SETTLEMENT_MISCLASSIFIED**: Detects rows missing split_type with only 1 split_with target, reclassifying them as a `Settlement` instead of an `Expense`. (AUTO_RESOLVED)

### Database Schema Notes
- Soft deletion is used for expenses (`deleted_at`, `superseded_by_anomaly_id`) to allow Meera to approve candidate duplicates before they vanish.
- Idempotency is supported via hashing the CSV row and tracking `source_row_number`.
