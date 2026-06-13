# Kharchwise

A shared expenses app for flatmates, built with Node.js, Express, Prisma, PostgreSQL, React, and Tailwind v4.

## Setup Instructions

### Prerequisites
- Node.js
- A local PostgreSQL database

### 1. Database Setup
1. Open `backend/.env` and update the `DATABASE_URL` if your local postgres credentials differ from the default (`postgresql://postgres:postgres@localhost:5432/kharchwise?schema=public`).
2. Run migrations to create the schema:
   ```bash
   cd backend
   npx prisma db push
   ```
3. Run the seed script:
   ```bash
   npm run seed
   ```

### 2. Backend Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Start the server (runs on port 3001):
   ```bash
   npx ts-node src/index.ts
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
3. Open the browser to see the 3D card carousel animation.

### Testing the Import Endpoint
You can test the CSV import pipeline using `curl` or Postman:
```bash
curl -X POST -F "file=@/path/to/expenses_export.csv" http://localhost:3001/api/import
```
This will return a JSON report of all rows processed and anomalies detected.
