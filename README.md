
# Expense Tracker (Full-Stack)

Expense Tracker with personal and group expenses, authentication, analytics dashboard, and group split tracking.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Auth: JWT

## Implemented Features

- Register, login, logout
- Personal expense create/list/delete
- Group create, add members, and group expenses with split logic
- Balance tracking: who owes you / who you owe
- Dashboard analytics:
	- Monthly spending summary
	- Category pie chart
	- Monthly bar chart
	- Most spent category
- Home overview:
	- Groups list
	- Friends list
	- Balance summary
	- Recent expenses

## Project Structure

- Frontend app in `src/`
- Backend app in `backend/` (MVC + Service Layer)

```text
backend/src/
├── app.js
├── server.js
├── config/
├── models/
├── routes/
├── controllers/
├── services/
├── validations/
├── middleware/
└── utils/
```

## Setup

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
npm --prefix backend install
```

3. Configure backend environment:

```bash
copy backend\.env.example backend\.env
```

Edit `backend/.env`:

- `MONGO_URI`
- `JWT_SECRET`
- `PORT` (default `4000`)
- `CLIENT_ORIGIN` (default `http://localhost:5173`)

## Run

Single terminal (recommended):

```bash
npm run dev:fullstack
```

If port `4000` is already occupied, this command assumes the backend is already running and starts only the frontend.

Or use two terminals:

Terminal 1:

```bash
npm run server
```

Terminal 2:

```bash
npm run dev
```

Frontend: http://localhost:5173
Backend health: http://localhost:4000/api/health
