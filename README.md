# Recipe Finder

A Dockerized recipe app with a Vite/React frontend, Nitro backend, and Postgres database.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ if running outside Docker

## Run For Development

```sh
cp .env.example .env
docker compose up --build
```

Open the frontend at `http://localhost:5173`.

The Nitro API runs at `http://localhost:3001`, and Vite proxies frontend `/api/*` calls to it during development.

## Run For Production

```sh
cp .env.production.example .env.production
# Edit .env.production and set strong values for POSTGRES_PASSWORD and AUTH_SECRET.
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
```

Open the app at `http://localhost` unless you set a different `WEB_PORT`.

The production Compose file:

- builds static frontend assets into an Nginx image
- proxies same-origin `/api/*` requests from Nginx to the Nitro API
- keeps Postgres and the API off public host ports
- requires production secrets at startup
- adds container health checks

Use a reverse proxy or load balancer in front of the `web` service for TLS termination.

## Local Development Without Docker

```sh
npm install
npm run dev
```

For local API development outside Docker, set `DATABASE_URL` to a Postgres connection string reachable from your host.

## Project Layout

```text
apps/
  api/    Nitro backend
  web/    Vite + React frontend
db/init/  Postgres initialization SQL
```
