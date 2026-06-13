# Decision Log

### 1. Database ORM & Connection
- **Decision:** Use Prisma with PostgreSQL.
- **Why:** Prisma provides excellent type safety and auto-generated migrations which perfectly fit the 2-day rapid development constraint. PostgreSQL is robust and standard for relational DBs.
- **Alternatives Considered:** Raw SQL via `pg` or `typeorm`. Prisma was chosen for developer velocity.
- **Note:** Pinned Prisma 5.x — v7 requires migrating to prisma.config.ts for datasource URLs, which adds setup complexity not justified for this project's timeline.

### 2. GroupMembership Tracking
- **Decision:** Explicitly track `joined_at` and `left_at` in a `GroupMembership` table instead of a simple boolean `isActive`.
- **Why:** Balances need to be point-in-time accurate. When Sam moves in or Meera moves out, expenses logged on a specific date should only be split among active members *on that date*. Checking `joined_at <= expense.date < (left_at OR infinity)` handles this elegantly.
- **Alternatives Considered:** Creating new "groups" every time someone joins or leaves, which would fragment the history.

### 3. ExpenseSplit as Source of Truth
- **Decision:** An `ExpenseSplit` table explicitly logs every single member's financial share (in INR) for every expense.
- **Why:** Satisfies Rohan's requirement: *"If the app says I owe ₹2,300, I want to see exactly which expenses make that up."* Aggregate balances can be dynamically computed from these splits without "magic numbers."
- **Alternatives Considered:** Only storing the raw expense and recalculating splits on the fly. This was rejected because split calculations (like percentages) can suffer from rounding inconsistencies if not materialized.

### 4. Special Case for Dev
- **Decision:** Do not add Dev to `GroupMembership`, but add him as a `User` and allow him in `ExpenseSplit`.
- **Why:** Dev is a one-time guest. Membership governs ongoing visibility (like rent or wifi), but individual expenses can still explicitly list him as a participant.
- **Alternatives Considered:** Adding him to the group and expiring his membership instantly, but this blurs the line between flatmates and guests.

### 5. USD_TO_INR Conversion
- **Decision:** Use a fixed constant `USD_TO_INR = 83.5` during import.
- **Why:** For this assignment, a fixed rate is sufficient and predictable.
- **Alternatives Considered:** Calling a live FX API or storing a date-indexed FX table, which is too heavy for the prompt scope.

### 6. Precision Rounding
- **Decision:** Round half up to 2 decimals using `Math.round(val * 100) / 100`.
- **Why:** Standard math rounding is expected by consumers in financial apps, avoiding the drift of banker's rounding.
- **Alternatives Considered:** Banker's rounding (round half to even).

### 7. Fuzzy Matching (Name Normalization)
- **Decision:** Use `fuzzball` library with `token_set_ratio`.
- **Why:** Easily resolves minor inconsistencies ("Priya", "Priya S", "rohan ") against canonical names with a threshold score (80).
- **Alternatives Considered:** Exact matching with `.trim().toLowerCase()`, which fails on suffixes like "S".

### 8. Authentication Scope
- **Decision:** Use simple JWT-based auth with a 7-day expiry, no refresh tokens, and no email verification.
- **Why:** Intentionally scoped down for a 2-day assignment. The core logic of Kharchwise is the balance engine and group management, not auth boilerplate. 
- **Production Path:** For a production release, we would add rotating refresh tokens (stored in HTTP-only cookies), email verification via Magic Links or OTP, and rate limiting on the `/login` route to prevent brute force attacks.

### 9. Soft-Closing Memberships
- **Decision:** Removing a member from a group only updates `left_at = now()`. It does not delete the row.
- **Why:** Historical balance calculations for past expenses must remain valid. If Meera leaves the flat, the fact that she was there in February and incurred rent expenses cannot be erased, otherwise the sum of the system's ledger breaks.

### 10. Balance Engine Architecture
- **Decision:** The Balance Engine (`balanceEngine.ts`) is built as a pure, side-effect-free isolated module. 
- **Why:** Financial calculation algorithms are highly prone to edge case bugs and changing business requirements. By isolating it entirely from the Express controllers and side effects, it allows comprehensive unit testing (like the money conservation theorem check) and makes it trivial to change rounding rules or calculation logic later without touching API routing.
