# Ledger — Banking Transaction System Frontend

Ledger is a production-oriented React frontend for the deployed **Banking Transaction System**. It uses the connected backend as the source of truth for authentication, account records, balances, and idempotent transfers. It intentionally does not fabricate balances, transactions, account identifiers, or ledger rows.

## Features

- Cookie/Bearer-based login, registration, logout, and protected routes.
- Responsive banking shell with overview, account, transfer, settings, transactions, and ledger views.
- Live account listing and ledger-derived balance lookup.
- Backend-backed transfer flow with review confirmation and a unique idempotency key per user-created request.
- Human-readable validation, authorization, network, conflict, and service error states.
- Mobile-first navigation, accessible labels, visible focus states, and reduced-motion support.
- Explicit contract notes for backend capabilities that are documented conceptually but do not currently expose read endpoints.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS 4, Wouter, Lucide React, and Sonner. API access is centralized in `client/src/lib/api.ts`; authentication state is centralized in `client/src/contexts/AuthContext.tsx`.

## Verified API integration

The browser uses a same-origin frontend proxy by default, which forwards requests server-side to the deployed backend and avoids the backend’s current browser CORS allowlist limitation. The implementation uses the following deployed routes from the public backend contract:

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register with `email`, `name`, and `password` |
| `POST` | `/api/auth/login` | Login with `email` and `password` |
| `POST` | `/api/auth/logout` | End the authenticated session |
| `POST` | `/api/accounts/` | Create an account |
| `GET` | `/api/accounts/` | List accounts for the authenticated user |
| `GET` | `/api/accounts/balance/:accountId` | Read a ledger-derived account balance |
| `POST` | `/api/transactions/` | Create an authenticated transfer with `fromAccount`, `toAccount`, `amount`, and `idempotencyKey` |
| `GET` | `/api/transactions/account/:accountId` | Read authenticated transaction history for an account |

The deployed backend root responds with `Ledger Service is up and running`. Transaction history is loaded from the authenticated account-specific endpoint and displayed in the Transactions page. The Ledger page remains an explicit unsupported state because no authenticated ledger-read endpoint has been provided.

## Local setup

```bash
pnpm install
pnpm dev
```

Create a local `.env` file only if you need to point the frontend at a different backend. Leave `VITE_API_BASE_URL` blank to use the same-origin proxy, which is the recommended setup for the deployed frontend.

## Environment variables

```bash
VITE_API_BASE_URL=
```

`VITE_` variables are public browser configuration. Do not put JWT secrets, database credentials, email credentials, or other private values in frontend environment variables.

## Deployment

Build the static frontend with:

```bash
pnpm build
```

Deploy the generated frontend with its Node/Express server so the `/api/*` same-origin proxy is available. If deploying the client as a purely static site, configure `VITE_API_BASE_URL` to a backend that allows the deployed frontend origin in CORS and allows credentials if it relies on an HTTP-only cookie. The current proxy avoids the deployed backend’s browser CORS restriction.

## Architecture

```text
React routes
  ↓
Reusable page and state components
  ↓
AuthContext + API client
  ↓
Cookie / Authorization header
  ↓
Deployed Express + MongoDB banking service
```

## Future improvements

Add the backend’s authenticated transaction-history and ledger-read routes to the centralized API client, then connect the already-designed states in `/app/transactions` and `/app/ledger`. Add API contract tests against a non-production backend environment before broad release.

## Screenshots

Screenshots are generated from the active WebDev preview during review. No financial data is bundled into this repository.

## Scope note

This is a demonstration banking transaction system frontend. It is not a real bank, payment instrument, or financial service.
