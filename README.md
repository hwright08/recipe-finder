# Recipe Finder

A Dockerized recipe app with a Vite/React frontend, Nitro backend, and Supabase Postgres database.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ if running outside Docker
- A Supabase project for Postgres

## Run For Development

```sh
cp .env.example .env
# Edit .env and set DATABASE_URL and AUTH_SECRET.
docker compose up --build
```

Open the frontend at `http://localhost:5173`.

The Nitro API runs at `http://localhost:3001`. The API container runs the idempotent schema migration before starting.

## Run For Production

```sh
cp .env.production.example .env.production
# Edit .env.production and set DATABASE_URL, AUTH_SECRET, and FRONTEND_ORIGIN.
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
```

Open the app at `http://localhost` unless you set a different `WEB_PORT`.

The production Compose file:

- builds static frontend assets into an Nginx image
- proxies same-origin `/api/*` requests from Nginx to the Nitro API
- connects the API to Supabase Postgres with `DATABASE_URL`
- runs the idempotent schema migration before the API starts
- keeps the API off public host ports
- requires production secrets at startup
- adds container health checks

Use a reverse proxy or load balancer in front of the `web` service for TLS termination.

## Deploy To Render

This repo includes a Render Blueprint in `render.yaml` for:

- a Node API service
- a static frontend site

In Render, create a new Blueprint from this repository. Set the API `DATABASE_URL` to your Supabase session pooler connection string, and the API service runs the existing database schema before startup with `npm run migrate -w @recipe-finder/api`.

The default service names produce these URLs:

- API: `https://recipe-finder-api.onrender.com`
- Web: `https://recipe-finder-web.onrender.com`

If you rename either service, update these environment variables in Render:

- API `DATABASE_URL` must be your Supabase session pooler connection string.
- API `FRONTEND_ORIGIN` must match the web site origin.
- Web `VITE_API_BASE` must be the API URL with `/api` appended.

## Local Development Without Docker

```sh
npm install
npm run dev
```

For local API development outside Docker, set `DATABASE_URL` to a Postgres connection string reachable from your host.

## Supabase Database

To use Supabase Postgres:

1. Create a Supabase project.
2. Copy `.env.example` or `.env.supabase.example` to `.env`.
3. Set `DATABASE_URL` to the Supabase Postgres connection string.
4. Run `npm run migrate -w @recipe-finder/api`, or let Docker run it when the API container starts.

Use Supabase's session pooler connection string for a long-running Node API:

```sh
DATABASE_URL=postgresql://postgres.your-project-ref:your-database-password@aws-0-your-region.pooler.supabase.com:5432/postgres
AUTH_SECRET=replace-this-with-at-least-32-random-characters
FRONTEND_ORIGIN=http://localhost:5173
VITE_API_BASE=http://localhost:3001/api
```

Keep `AUTH_SECRET` because this app currently uses its own auth/session tables rather than Supabase Auth.

## Project Layout

```text
apps/
  api/    Nitro backend
  web/    Vite + React frontend
db/init/  Postgres initialization SQL
```
