# Kharchwise

A shared expenses app for flatmates, built with Node.js, Express, Prisma, PostgreSQL, React, and Tailwind v4.

## Setup Instructions

### Prerequisites
- Node.js
- A PostgreSQL database (e.g. NeonDB)

### 1. Database Setup
1. Open `backend/.env` and ensure `DATABASE_URL` is set to your Postgres instance.
2. Run migrations to create the schema:
   ```bash
   cd backend
   npx prisma db push
   ```
3. Run the seed script:
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

### Application Structure
- **/api/auth**: Authentication and User registration
- **/api/groups**: Group management
- **/api/groups/:id/expenses**: Add, view, and manage expenses
- **/api/groups/:id/import**: Import CSV exports to automatically categorize expenses
- **/api/groups/:id/balances**: Automatic Penny-perfect balance computation
- **/api/users/search**: Search registered users
