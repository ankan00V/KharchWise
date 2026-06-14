# Scope and Anomaly Log

### Anomaly Detectors Implemented
1. **NUMBER_FORMAT**: Detects commas in amounts (e.g. "1,200") and strips them. (AUTO_RESOLVED)
2. **WHITESPACE**: Trims leading/trailing whitespace in amounts or names. (AUTO_RESOLVED)
3. **PRECISION_ROUNDING**: Rounds amounts to 2 decimals using round half up. (AUTO_RESOLVED)
4. **DATE_FORMAT**: Normalizes dates into ISO (`YYYY-MM-DD`). Infers year for "Mon DD". (AUTO_RESOLVED)
5. **DATE_AMBIGUOUS**: Flags dates like "04/05/2026" that could be DD/MM or MM/DD, resolving chronologically based on file context but marking for review. (AUTO_RESOLVED / PENDING_APPROVAL)
6. **NAME_NORMALIZATION**: Fuzzy-matches names to canonical Users. (AUTO_RESOLVED if score >80, else PENDING_APPROVAL)
7. **MISSING_PAYER**: QUARANTINED from balance calculations until resolved.
8. **MISSING_CURRENCY**: Empty currency defaults to INR. (AUTO_RESOLVED)
9. **CURRENCY_CONVERSION**: Converts USD to INR at a fixed config rate. (AUTO_RESOLVED)
10. **NEGATIVE_AMOUNT**: Treats negative amounts as credits/refunds, imported standalone. (PENDING_APPROVAL)
11. **ZERO_AMOUNT**: Imports 0 amount as a valid zero-value expense. (AUTO_RESOLVED)
12. **SETTLEMENT_MISCLASSIFIED**: Detects rows missing split_type with only 1 split_with target, reclassifying them as a `Settlement` instead of an `Expense`. (AUTO_RESOLVED)
13. **PERCENTAGE_MISMATCH**: Detects when percentage splits do not sum to exactly 100%. (PENDING_APPROVAL)
14. **SPLIT_TYPE_CONTRADICTION**: Detects when split_type is 'equal' but split_details are provided. (AUTO_RESOLVED)
15. **MEMBERSHIP_MISMATCH**: Checks if a user in split_with was an active group member on the expense date. (PENDING_APPROVAL)
16. **UNKNOWN_PARTICIPANT**: Detects participants who aren't canonical users or special cases. (PENDING_APPROVAL)
17. **EXACT_DUPLICATE** / **CONFLICTING_DUPLICATE**: Detects duplicates based on date, description fuzzy matching, and amounts. (PENDING_APPROVAL)

### Database Schema Notes
- Soft deletion is used for expenses (`deleted_at`, `superseded_by_anomaly_id`) to allow Meera to approve candidate duplicates before they vanish.
- Idempotency is supported via hashing the CSV row and tracking `source_row_number`.
