# Scope & Data Anomaly Management

This document details the scope of the data anomalies encountered during CSV imports, how they are handled, and the underlying PostgreSQL database schema supporting the application.

## 1. Anomaly Log & Data Problem Handling
When importing financial data via CSV, the real-world data often contains inconsistencies. Instead of aborting an entire 500-row CSV import because of one bad row, KharchWise uses a **Quarantine Architecture**.

Valid rows are instantly inserted into the database and affect balances. Invalid or anomalous rows are inserted into the `ImportAnomaly` table. These rows are **quarantined** and do not affect user balances until a user explicitly resolves them through the UI.

### Data Problems Encountered & Actions Taken

| Data Problem Detected | Action Taken by KharchWise Import Logic |
| :--- | :--- |
| **Exact Duplicate Row** (Same Amount, Date, Description, Payer) | The row is skipped entirely. A silent `DUPLICATE_ROW` anomaly is logged for auditing, but requires no user action. |
| **Suspected Duplicate** (Same Amount & Date, but slightly different Description/Payer) | Logged as `SUSPECTED_DUPLICATE` anomaly. The row is quarantined. The user is prompted via the UI to either *Approve* (treat as distinct expense) or *Reject* (discard as duplicate). |
| **Unknown Payer / User** (The "Paid By" name in CSV doesn't match any group member) | Logged as `UNKNOWN_PAYER` anomaly. The row is quarantined. The user is prompted to map the unknown string (e.g., "Ankan") to an actual registered group member ID. Once mapped, the anomaly is resolved and the expense becomes active. |
| **Negative Amounts** (Refunds, cashbacks, or data-entry errors) | Logged as `NEGATIVE_AMOUNT` anomaly. The row is quarantined. The user is given the choice to either *Discard* the negative row or convert it into an *Absolute Positive* value. |
| **Missing Split Information** | Handled automatically. The application assumes the split type is `EQUAL` and equally divides the expense among all members who were active in the group on the specified transaction date. |

## 2. Database Schema
KharchWise is built on a highly relational PostgreSQL database managed via Prisma ORM.

### Core Tables

*   **`User`**: Represents individuals. Holds authentication data, canonical names, and relations to expenses they paid and their group memberships.
*   **`Group`**: Represents a shared expense environment (e.g., "Goa Trip").
*   **`GroupMembership`**: A join table mapping Users to Groups. It tracks `joined_at` and `left_at` timestamps to ensure expenses are only split among members active at the time of the transaction.

### Financial Tables

*   **`Expense`**: The core transactional record. Tracks `amount`, `description`, `date`, `paid_by_id`, and `split_type`. Also includes a `deleted_at` field for soft deletes.
*   **`ExpenseSplit`**: Represents the granular breakdown of how much each user owes for a specific `Expense`. Supports equal, percentage, or exact amount splits.
*   **`Settlement`**: Records when a user pays back another user, reducing their owed balance without creating a new expense. Tracks `from_user_id` and `to_user_id`.

### Anomaly Management Tables

*   **`ImportAnomaly`**: The quarantine table. Records the exact `csv_row_number`, the `raw_value` that caused the issue, the `anomaly_type`, and its resolution `status` (e.g., `PENDING_APPROVAL`, `RESOLVED`). It features relational links back to the user who resolved it and the final `Expense` record it produced upon resolution.
