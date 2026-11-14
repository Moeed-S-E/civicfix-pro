# CivicFix Pro

A workshop-ready MERN civic issue reporter with a public reporting form and an admin analytics dashboard.

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB (local or hosted)

## Setup

1. Install the root and app dependencies:

   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

2. Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI`, `JWT_SECRET`, and `PASSWORD_PEPPER` to strong, independently generated secrets (at least 32 random bytes each for the latter two).
3. Seed sample reports and a demo admin (`admin` / `admin`) into MongoDB:

   ```bash
   npm run seed --prefix server
   ```

   Passwords are processed with an HMAC-SHA256 pepper held in server configuration and a per-password random bcrypt salt before only the resulting hash is stored in MongoDB. The demo credentials are intentionally weak and must not be used outside a local workshop.

4. To create a separate admin account with an interactive password prompt, use:

   ```bash
   npm run create-admin --prefix server
   ```

5. Start both apps from the repository root:

   ```bash
   npm run dev
   ```

The client runs at `http://localhost:5173`; the API runs at `http://localhost:5000`.
Citizens can submit reports without an account or login. The public community
feed shows all reports newest first with their title, category, location,
description, and status. Admin accounts live in MongoDB, with passwords stored as peppered bcrypt hashes. In the Admin Dashboard, sign in with an admin account to view analytics and moderate reports. The server
issues a signed JWT in an `HttpOnly`, `SameSite=Strict` cookie that expires
after one hour. The browser sends the cookie with admin API requests, and the
app checks the existing session on page load so refreshing does not require
signing in again.
React Router serves the community page at `/`, public report details at
`/reports/:id`, and the admin dashboard at `/admin`. The admin dashboard
automatically refreshes metrics and reports every 30 seconds.

To add sample civic reports and ensure the demo admin exists, run:

```bash
npm run seed --prefix server
```

The seed command is safe to rerun: it adds missing sample reports and creates
the default admin only if an `admin` account does not already exist. It never
resets an existing admin password.

## API

- `GET /api/issues/public` — all reports newest first with title, category, location, description, status, and date
- `GET /api/issues/public/:id` — public report details
- `GET /api/issues` — full reports, newest first; admin session required
- `GET /api/issues/stats` — report totals, status counts, and category counts; admin session required
- `POST /api/auth/login` — sign in and set the one-hour admin session cookie
- `GET /api/auth/session` — check the current admin session
- `POST /api/auth/logout` — clear the admin session cookie
- `POST /api/issues` — submit a report
- `PATCH /api/issues/:id/status` — change status; admin session required
- `GET /api/health` — service health

For a real deployment, protect the admin provisioning command and database,
serve the client over HTTPS, and configure `CORS_ORIGIN` to the exact deployed
client origin.
