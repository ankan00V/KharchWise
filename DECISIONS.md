# Decision Log

This document records the most significant architectural and design decisions made during the development of KharchWise. It details the options considered and the rationale behind the final choices.

## 1. Database Choice: PostgreSQL + Prisma ORM
**Options Considered:**
1. NoSQL (MongoDB)
2. SQL (PostgreSQL via Prisma ORM)

**Decision:** We chose **PostgreSQL via Prisma ORM**.

**Why:** KharchWise is fundamentally a financial application. Financial data is highly relational: Users belong to Groups, Expenses belong to Groups, and Expenses are divided into complex, many-to-many ExpenseSplits among Users. Trying to map this highly relational, normalized data structure into NoSQL documents would lead to data duplication and complex manual integrity checks. 
Furthermore, ACID compliance in PostgreSQL guarantees that money is not "lost" during concurrent transactions. We selected Prisma as the ORM because its strict, auto-generated TypeScript typings eliminate a massive class of runtime errors during development, providing confidence when calculating exact balances.

## 2. Global API Caching Architecture: SWR vs State Management
**Options Considered:**
1. Standard React `useState` / `useEffect` + Redux for global state
2. `@tanstack/react-query`
3. `swr` (Stale-While-Revalidate) by Vercel

**Decision:** We chose **`swr`**.

**Why:** The application backend is hosted on a Railway server (located in the US/Singapore), while the Vercel frontend is distributed via Edge. Standard `useState` fetching caused a ~1000ms network round-trip delay every time a user switched between the "Expenses", "Balances", and "Members" tabs, leading to a sluggish UX. 
Instead of building a complex Redux store to hold this data manually, we integrated `swr`. SWR aggressively caches API responses in the browser's memory. When the user clicks a tab, the data loads instantly (0ms latency) from the local cache, while SWR silently revalidates the data against the remote backend in the background. This single architectural shift made the entire application feel instantaneous.

## 3. Handling CSV Import Errors: Abort vs Quarantine
**Options Considered:**
1. **Strict Abort:** If a 500-row CSV contains one bad row (e.g., negative amount, unknown user), abort the entire import and return a 400 error.
2. **Silent Drop:** Import all valid rows, and silently delete/ignore any rows with errors.
3. **Quarantine Architecture:** Import valid rows immediately, and route invalid rows into a dedicated "Anomaly" quarantine state for user review.

**Decision:** We chose the **Quarantine Architecture**.

**Why:** The strict abort method results in a terrible user experience—users would have to manually edit their massive CSVs in Excel multiple times just to get a successful import. The silent drop method is dangerous for a financial app, as it quietly loses user money. 
By creating an `ImportAnomaly` database table, the backend parses a massive CSV, safely ingests the 99% of valid rows, and flags the 1% of problematic rows. The user is presented with a UI report of these anomalies and can resolve them individually (e.g., mapping a misspelled name to a real user, or rejecting a duplicate).

## 4. Separation of Environments: Monorepo vs Multi-repo
**Options Considered:**
1. Multi-repo (Frontend in one GitHub repo, Backend in another)
2. Monorepo (Single GitHub repository containing both)

**Decision:** We chose a **Monorepo**.

**Why:** Keeping the frontend and backend in the same repository allowed for rapid iteration and unified pull requests. We could easily track sweeping features (like integrating the SWR caching or building the Anomaly endpoints) in a single git commit that touched both `frontend/` and `backend/`. This also simplified deploying to Vercel (which just points to the `frontend` folder) and Railway (which points to the `backend` folder) from a single source of truth.
