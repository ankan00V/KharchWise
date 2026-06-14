# Kharchwise

A shared expenses app for flatmates, built with Node.js, Express, Prisma, PostgreSQL (NeonDB), React, and Tailwind v4.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- A PostgreSQL database (e.g. NeonDB)

### 1. Database Setup
1. Open `backend/.env` and ensure `DATABASE_URL` is set to your Postgres instance.
2. Run migrations to create the schema:
   ```bash
   cd backend
   npx prisma db push
   ```
3. Run the seed script to populate users and the "Goa Trip" group:
   ```bash
   npx ts-node prisma/seed.ts
   ```

### 2. Backend Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Start the server (runs on port 3001):
   ```bash
   npm run dev
   ```

### 3. Frontend App
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```

## Application Architecture

### Frontend (React + Tailwind v4)
- **Centralized API Client:** All requests go through `frontend/src/api.ts` to handle auth tokens and uniform error handling.
- **Design System:** The application uses the "Fold" Bauhaus poster aesthetic (Midnight Navy text, Fog White canvas, soft navy-tinted shadows, and pill-shaped interactive elements).
- **Authentication:** JWT-based auth persisted in `localStorage` through `AuthContext`.

### Backend (Node.js + Express)
- **Database:** Prisma ORM with PostgreSQL.
- **Import Pipeline:** A robust CSV parser using `csv-parse` and `fuzzball` for fuzzy string matching. The pipeline implements 17 distinct anomaly detectors.
- **Balance Engine:** An isolated, side-effect-free module that computes penny-perfect settlements by aggregating explicit `ExpenseSplit` records.

## AI Tools Used
- **Agentic AI Assistant (Antigravity):** Handled major architectural refactors, including migrating from SQLite to PostgreSQL, rewriting the CSV import pipeline for complex edge cases, and completely rebranding the frontend to the Fold aesthetic.
- **Fuzzball:** Used in the backend for intelligent fuzzy matching of user names to handle typos in CSV uploads.
