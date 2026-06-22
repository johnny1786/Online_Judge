# Production Upgrade Plan

This roadmap is ordered by risk and reflects existing files. It does not assume a hidden frontend or service.

## Milestone 0 — Make the foundation deployable

| Task | Why / impact | Affected files | Required change |
|---|---|---|---|
| Make secrets mandatory | Prevents predictable JWT secret if auth is added or environment is misconfigured | `src/config/env.js`, `.env.example`, tests | Branch configuration by `NODE_ENV`; require `JWT_SECRET` in production and reject default/example values |
| Reproducible build | A release must resolve the same dependency tree every build | `package-lock.json` (new), `Dockerfile`, CI workflow (new) | Generate and commit lockfile; use `npm ci --omit=dev`; pin production base image digest |
| Graceful lifecycle | Prevents lost requests/heartbeat and corrupt shutdown state | `src/server.js`, `worker/index.js`, `src/config/database.js`, `src/config/redis.js` | Add shutdown coordinator; stop server/Socket.IO, clear interval/key, close Mongoose/Redis, enforce drain timeout |
| Protect data services | Public unauthenticated Redis/Mongo ports are unsafe | `docker-compose.yml`, deployment manifests (new) | Remove host ports in production, private network, credentials/TLS, managed backups, least-privilege database user |
| Container health | Orchestrators need liveness/readiness | `Dockerfile`, `docker-compose.yml`, `src/routes/health.routes.js` | Add API/worker health checks and separate liveness/readiness policy |

**Acceptance criteria:** production startup fails with missing secret; image builds with lockfile; SIGTERM closes resources; Mongo/Redis are not reachable publicly; deployment detects unhealthy API/worker.

## Milestone 1 — Establish identity and safe API boundaries

| Task | Why / impact | Affected files | Required change |
|---|---|---|---|
| User domain | Enables ownership and controlled access | `src/models/user.model.js` (new), `src/routes/auth.routes.js` (new), controllers/services (new) | Define unique normalized email, role enum, password hash field, timestamps, safe serialization/indexes |
| Auth lifecycle | Avoids unauthenticated access and replay | auth controller/service/middleware files (new), `src/app.js`, `src/server.js` | Signup/login/refresh/logout; short-lived access tokens; hashed/rotated refresh tokens; middleware and RBAC |
| Socket authorization | Socket identity is currently anonymous | `src/server.js` | Add Socket.IO JWT middleware, room ACLs, event schemas, disconnect/error auditing |
| Input and output validation | Prevents malformed/overbroad payloads | all new routes, `src/middlewares/validation.js` (new) | Zod body/query/params schemas, allowlisted response DTOs, consistent validation errors |
| Distributed abuse protection | Local rate limits fail when scaled | `src/app.js`, Redis config, new rate-limit config | Use Redis store and endpoint-specific limits; configure trusted proxy only for known ingress |

**Acceptance criteria:** protected routes reject missing/invalid/expired/revoked credentials; roles are tested; Socket.IO cannot connect anonymously; invalid input never reaches services.

## Milestone 2 — Build persistent product domains

| Task | Why / impact | Affected files | Required change |
|---|---|---|---|
| Problem/submission schemas | Required for product data and auditable state | `src/models/*` (new) | Define validation, indexes, immutable fields, timestamps, status state machine, private test-case protection |
| API service boundaries | Keeps controllers maintainable | `src/routes/*`, `src/controllers/*`, `src/services/*` (new) | Add versioned APIs, pagination/cursors, authorization checks, audit events, standard error mapping |
| Data operations | Prevents slow/unbounded data access | model files and tests (new) | Add indexes based on queries, projection, pagination, atomic updates, migrations/versioned data repair scripts |
| Caching policy | Avoids ad-hoc Redis use and stale data | `src/services/cache.service.js` (new) | Document keys/TTLs/invalidations; avoid caching private records without scoped keys |

**Acceptance criteria:** models, indexes, authorization, validation, and integration tests cover all documented domain endpoints.

## Milestone 3 — Add distributed judging safely

| Task | Why / impact | Affected files | Required change |
|---|---|---|---|
| Submission queue | Decouples request latency from execution | `src/queues/submission.queue.js`, `worker/processors/submission.processor.js` (new) | BullMQ queue/worker, idempotency IDs, retries/backoff, DLQ, concurrency limits, job cleanup, metrics |
| Sandbox adapter | Untrusted code is the primary platform risk | `worker/runners/*` (new), `worker/sandbox/*` (new), Docker assets (new) | Strategy runners, ephemeral container invocation, no network, non-root, RO root, dropped caps, no-new-privileges, CPU/memory/PID/time/output quotas, cleanup |
| Verdict persistence/events | Makes result delivery reliable | submission model/service, `src/events/*`, `src/server.js` | Persist state transitions atomically, outbox/event delivery, authenticated Socket.IO user rooms, replayable status API |
| Fleet health | Shared key hides worker failures | `worker/index.js`, Redis service, health controller | Worker-ID heartbeat and consumer/queue depth/age metrics; aggregate readiness |

**Acceptance criteria:** hostile code cannot escape sandbox in automated tests; retries are idempotent; every terminal verdict persists once; dead jobs are inspectable; workers scale independently.

## Milestone 4 — Operate and ship

| Task | Why / impact | Affected files | Required change |
|---|---|---|---|
| Observability | Production incidents need evidence | logger/config/server/worker files, `infra/observability` (new) | Structured correlation IDs, OpenTelemetry traces, Prometheus metrics, dashboards, alerts, runbooks |
| CI/CD | Avoids unverified releases | `.github/workflows/ci.yml` (new), deployment files (new) | Lint/test/coverage, dependency and secret scans, image scan/SBOM, signed image publish, staged deploy/rollback |
| Backup/DR | Protects persistent user/submission data | infrastructure docs/manifests (new) | Mongo backups/PITR, Redis role defined, restore tests, RPO/RTO, access review |
| Security program | Prevents regression | `.github/dependabot.yml`, `SECURITY.md`, policies (new) | Dependency updates, secret scanning, vulnerability SLA, disclosure process, periodic threat model |

**Acceptance criteria:** release is CI-gated, observable, recoverable, access-controlled, and has a tested rollback path.
