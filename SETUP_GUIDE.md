# Setup Guide

This guide starts the implemented Phase 1 API and heartbeat worker. It cannot start a frontend, judge queue, file storage, AI pipeline, or submission system because those components do not exist in this repository.

## 1. Prerequisites

Install the following:

- Node.js 20.11+ and npm — runs the API, worker, tests, and linting.
- Docker Desktop with Docker Compose — runs MongoDB, Redis, API, and worker together.
- `curl` — optional, for health endpoint checks.

Verify installations:

```bash
node --version       # prints installed Node version
npm --version        # prints npm version
docker --version     # prints Docker CLI version
docker compose version # prints Compose plugin version
```

## 2. Configure environment variables

```bash
cp .env.example .env # creates your ignored local configuration file
```

| Variable | Local host-process value | Compose value | Meaning |
|---|---|---|---|
| `NODE_ENV` | `development` | `development` | Runtime mode |
| `PORT` | `3000` | `3000` | HTTP port |
| `MONGODB_URI` | `mongodb://localhost:27017/ojx` | overridden to `mongodb://mongo:27017/ojx` | MongoDB URI |
| `REDIS_URL` | `redis://localhost:6379` | overridden to `redis://redis:6379` | Redis URI |
| `JWT_SECRET` | 32+ random characters | same | Reserved; authentication is not implemented |
| `CORS_ORIGIN` | frontend origin | same | Allowed browser origin(s) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | same | Rate-limit period in milliseconds |
| `RATE_LIMIT_MAX` | `100` | same | Requests per period per in-memory limiter key |

Generate a non-placeholder secret for future use:

```bash
openssl rand -base64 48 # prints a random value; paste it into JWT_SECRET
```

## 3. Start with Docker Compose

```bash
docker compose up --build # builds the app image and starts MongoDB, Redis, API, and worker
```

This is the simplest local route. API logs and worker logs remain attached to the terminal. Stop with `Ctrl+C`; current code does not yet implement graceful application shutdown, so use `docker compose down` afterward if necessary.

In another terminal:

```bash
curl -i http://localhost:3000/health # verifies API, MongoDB, Redis, and worker heartbeat
docker compose down                   # stops and removes service containers; named data volumes remain
```

To also remove local MongoDB/Redis data:

```bash
docker compose down -v # destructive for the Compose named volumes
```

## 4. Run services from the host

Start only data services:

```bash
docker compose up mongo redis # starts MongoDB and Redis in the foreground
```

Set `.env` host-process URIs to `localhost`, then install dependencies and start each process in separate terminals:

```bash
npm install       # installs package.json dependencies; creates package-lock.json if npm is available
npm run dev       # starts API with Node watch mode
npm run worker    # starts the worker and Redis heartbeat loop
```

## 5. Tests and static checks

```bash
npm test              # runs Jest/Supertest health-route integration tests
npm run lint          # runs ESLint over JavaScript files
npm run test:coverage # runs tests and creates coverage output
```

The current suite covers only health endpoints. It does not require live MongoDB or Redis because health probes are injected in tests.

## 6. Database, Redis, AWS, frontend, and workers

- **Database:** Compose initializes an empty MongoDB instance; current code creates no collections or indexes.
- **Redis:** Compose starts a local append-only Redis instance. Current code uses it only for connection health and `ojx:worker:heartbeat`.
- **AWS:** No AWS SDK, infrastructure definition, or AWS configuration is present. No AWS setup applies.
- **Frontend:** No frontend source or start command exists. No frontend can be run.
- **Worker:** `npm run worker` starts only the heartbeat worker, not a queue processor.
