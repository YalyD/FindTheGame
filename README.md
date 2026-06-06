# Find The Game ⚽🚗

A ride-sharing web app for football fans. Fans who need a lift to a match are
matched with fans already driving there — split the fuel, fill the empty seats,
go to the game together.

> Final project for the Software Engineering technician track (BSMACH / מה"ט).
> The UI is in Hebrew (RTL).

---

## Features

- **Google sign-in only** — no passwords. The backend verifies the Google ID
  token and issues its own JWT. First-time users complete a short profile
  (favourite team, home address, car).
- **Ride requests & offers** — pick an upcoming game, then either request a ride
  or offer seats from your starting point.
- **Matching** — passengers see the most suitable offer first and join with one tap.
- **Web Push notifications** — both sides get notified when a match happens
  (VAPID / service worker, no polling).
- **Address autocomplete & geolocation** — powered by OpenStreetMap Nominatim and
  the browser Geolocation API.

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19 + TypeScript, Vite, MUI, TanStack Query, axios |
| Backend  | Node.js + Express 5 + TypeScript, Mongoose |
| Database | MongoDB |
| Auth     | Google OAuth (`google-auth-library`) + JWT |
| Push     | Web Push (`web-push`, VAPID) |
| Infra    | Docker Compose, nginx reverse proxy, HTTPS |
| Tests    | Vitest (client: Testing Library + jsdom; server: supertest) |

## Repository layout

```
.
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # Screen-level components (Main, Match, Create*, …)
│   │   ├── components/     # Feature-grouped UI: game/ activity/ match/
│   │   │                   #   address/ notifications/ layout/ profile/ shared/
│   │   ├── hooks/          # usePushSubscription, …
│   │   ├── lib/            # Pure helpers (date formatting, …)
│   │   ├── constants.ts    # All user-facing strings (Hebrew), centralized
│   │   └── types.ts        # Shared domain types
│   └── test/               # Vitest unit + component tests
├── server/                 # Express API
│   └── src/
│       ├── routes/         # auth, users, games, ride-requests, ride-offers,
│       │                   #   notifications, push, health
│       ├── models/         # Mongoose schemas
│       ├── middleware/     # auth, rate limits, error handling
│       ├── lib/            # env validation, web push
│       └── scripts/        # game seeding / sync utilities
├── scripts/                # generate-cert.{sh,ps1} — self-signed TLS for prod
├── certs/                  # TLS cert + key (git-ignored)
├── docker-compose.dev.yml  # Local dev stack (hot reload)
└── docker-compose.prod.yml # Production stack (nginx + HTTPS)
```

## Prerequisites

- [Docker](https://www.docker.com/) + Docker Compose
- A **Google OAuth Client ID** ([Google Cloud Console](https://console.cloud.google.com/apis/credentials))
- A **VAPID key pair** for Web Push — generate with:
  ```bash
  npx web-push generate-vapid-keys
  ```

## Configuration

Create a `.env` file in the repo root (read by Docker Compose):

```dotenv
# Auth
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
JWT_SECRET=at-least-32-characters-long-random-secret

# Web Push (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=you@example.com

# Optional — football fixtures provider used by the sync script
RAPIDAPI_KEY=...

# Production only
CLIENT_ORIGIN=https://your-domain
MONGO_ROOT_USER=admin
MONGO_ROOT_PASS=change-me
```

`JWT_SECRET` must be at least 32 characters; the server validates all env vars on
boot (`server/src/lib/env.ts`) and refuses to start on bad config.

## Running locally (development)

```bash
docker compose -f docker-compose.dev.yml up --build
```

| Service  | URL                     |
|----------|-------------------------|
| Frontend | http://localhost:5173   |
| API      | http://localhost:4000   |
| MongoDB  | localhost:27017         |

Source folders are bind-mounted, so client and server both hot-reload.

### Seeding games

The games list is empty until seeded. Run a seed script inside the running
server container:

```bash
docker compose -f docker-compose.dev.yml exec server npx tsx src/scripts/seedGames.ts
```

(`seedKnownGames.ts` and `syncGames.ts` are also available; `syncGames` pulls
real fixtures and needs `RAPIDAPI_KEY`.)

## Running in production

1. Generate a TLS certificate into `./certs/` (self-signed for testing):
   ```bash
   ./scripts/generate-cert.sh        # or scripts/generate-cert.ps1 on Windows
   ```
2. Fill in the production env vars (`CLIENT_ORIGIN`, `MONGO_ROOT_USER`,
   `MONGO_ROOT_PASS`, …) in `.env`.
3. Bring up the stack:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

nginx serves the built frontend and reverse-proxies `/api` to the server on
ports 80/443. MongoDB runs with authentication enabled.

## Local development without Docker

Each package is a standard npm project. With a MongoDB instance reachable and the
env vars exported:

```bash
# API
cd server && npm install && npm run dev

# Frontend (needs VITE_GOOGLE_CLIENT_ID, proxies /api to VITE_API_TARGET)
cd client && npm install && npm run dev
```

## Testing

```bash
# Frontend
cd client && npm test

# Backend
cd server && npm test
```

- **Client:** Vitest + Testing Library (jsdom) — unit tests for pure helpers and
  component tests for the main screens.
- **Server:** Vitest + supertest covering every API route.

Both packages also expose `npm run typecheck`.

## API surface

All routes are under `/api` and (except auth/health) require a
`Authorization: Bearer <jwt>` header.

| Prefix                 | Purpose |
|------------------------|---------|
| `/api/auth`            | Google sign-in → JWT |
| `/api/users`           | Profile read/update |
| `/api/games`           | Upcoming games |
| `/api/ride-requests`   | Create / list / cancel ride requests |
| `/api/ride-offers`     | Create / list / join / cancel ride offers |
| `/api/notifications`   | List + mark-as-read |
| `/api/push`            | VAPID public key + subscription registration |
| `/api/health`          | Health check |
