# KharchWise 💸

KharchWise is a modern, high-performance web application designed to track group expenses, calculate exact balances, and handle complex CSV expense imports with a robust anomaly detection quarantine system.

## Setup Instructions

This project is structured as a monorepo with a Node.js/Express backend and a React/Vite frontend.

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (e.g., Neon.tech or local Postgres)

### 1. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file and add your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:pass@host/db"
   PORT=3001
   ```
4. Push the Prisma schema to your database: `npx prisma db push`
5. Start the backend server: `npm run dev`

### 2. Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. The frontend is preconfigured to talk to `http://localhost:3001`. If your backend is hosted elsewhere, create a `.env` file:
   ```env
   VITE_API_URL="https://your-backend-url.com"
   ```
4. Start the frontend development server: `npm run dev`
5. Open your browser to `http://localhost:5173`.

## AI Usage
This application was pair-programmed and architected in collaboration with **Google DeepMind Antigravity**, an advanced agentic AI coding assistant. Please refer to `AI_USAGE.md` for detailed breakdowns of AI interactions, corrections, and prompts.
