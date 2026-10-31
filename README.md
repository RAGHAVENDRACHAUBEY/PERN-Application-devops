# Todo Board (drag & drop)

Kanban-style todo app: drag cards between **To Do / In Progress / Done** and reorder within a column.

| Layer | Tech |
| --- | --- |
| Frontend | React 19 + TypeScript (Vite), SWR, React Hook Form + Zod, dnd-kit |
| Backend | Node.js + Express + TypeScript, Zod validation |
| Database | PostgreSQL via Prisma ORM |

## Setup

1. Create a database: `createdb todo_dnd` (or any name).
2. `cp server/.env.example server/.env` and set `DATABASE_URL` to your credentials.
3. Install and migrate:
   ```bash
   npm run install:all
   npm run db:migrate
   ```
4. Run both (two terminals):
   ```bash
   npm run dev:server   # http://localhost:4000
   npm run dev:client   # http://localhost:5173  (proxies /api to :4000)
   ```

## API

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/todos` | |
| POST | `/api/todos` | `{ title, description?, status? }` |
| PATCH | `/api/todos/:id` | `{ title?, description? }` |
| PATCH | `/api/todos/:id/move` | `{ status, afterId }` (`afterId` = card to sit after, `null` = top) |
| DELETE | `/api/todos/:id` | |

## How ordering works

Each todo has a float `position`. A drop sends only `{status, afterId}`; the server puts the card
midway between its new neighbours, so only one row is written per drag. The client updates SWR's
cache optimistically and rolls back if the request fails.

## Docker

```bash
cp .env.example .env        # set POSTGRES_PASSWORD
docker compose up --build   # http://localhost:8080
```

Runs Postgres, a one-shot `migrate` job, the API and non-root nginx serving the built client and
proxying `/api`. `POSTGRES_PASSWORD` is required; `POSTGRES_USER`, `POSTGRES_DB` and `WEB_PORT` are optional.
