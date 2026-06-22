# OJX Architecture Review

**Audit scope:** every file and directory present in the repository at review time. The source tree contains 27 files, including placeholder `.gitkeep` files. There is no Git metadata directory, installed Node runtime, npm, Docker executable, `node_modules`, lockfile, frontend source, database schema, or CI configuration available in this workspace. Runtime tests therefore could not be executed here; findings are static-code evidence.

## Executive summary

OJX is a clean but very early backend foundation. It has sound initial separation for configuration, HTTP composition, health controllers/routes, error handling, and a standalone worker process. The repository's product ambition—a distributed, AI-powered online judge—is mostly documented as planned architecture, not implemented code. It is safe to describe as an **API/worker infrastructure prototype**, not a functional online judge or deployable production service.

## Project and stack overview

| Area | Actual implementation |
|---|---|
| Runtime | Node.js 20.11+ target, JavaScript ES modules |
| HTTP | Express 4, HTTP server, Helmet, CORS, express-rate-limit |
| Validation/config | Zod and dotenv |
| Logging | Pino and pino-http |
| Database | Mongoose connection only; no schema/model/query |
| Redis | ioredis connection and one heartbeat key |
| Realtime | Socket.IO server constructed; no events/auth/clients |
| Queue | BullMQ dependency only; no queue or worker consumer |
| Test | Jest + Supertest, two health endpoint cases |
| Containers | Node Alpine image and local Docker Compose Mongo/Redis/API/worker |

## Architecture by concern

### Frontend

No frontend architecture exists. There is no frontend directory, build system, static asset serving, UI route, or client API implementation. `CORS_ORIGIN` permits a configured external origin but does not prove a frontend exists.

### Backend and API

`src/server.js` waits for MongoDB and Redis then composes Express and Socket.IO. `src/app.js` applies global middleware and mounts only `/health`. `src/routes/health.routes.js` delegates to a dependency-injected controller. There are no business routes. API flow is therefore restricted to health reporting and 404/error responses.

### Database

Mongoose connects using `MONGODB_URI`; health uses `mongoose.connection.readyState`. `src/models` has only `.gitkeep`. No collections/tables, indexes, migrations, transactions, or persistence flows exist. `docs/data-model.md` is explicitly a roadmap, not schema implementation.

### Authentication

There is no authentication flow. `JWT_SECRET`, `JWT_EXPIRES_IN`, `bcryptjs`, and `jsonwebtoken` are unused by source code. No login/signup routes, password storage, sessions, bearer verification, RBAC, or Socket.IO authentication exist.

### Queue, worker, and Redis

The worker connects to MongoDB and Redis and writes `ojx:worker:heartbeat` every 10 seconds with a 30-second expiry. API `/health/worker` performs Redis `EXISTS` against that key. BullMQ is never imported. There is no queue, retry, processing, job persistence, autoscaling, dead-letter queue, code runner, or sandbox.

### File storage and AI/ML

Neither is present: no storage SDK/route/bucket, and no model/provider/prompt/vector/ML code.

### Security implemented

Implemented controls: Helmet, disabled `X-Powered-By`, global body cap of 1 MB, configurable CORS origins, global express-rate-limit, Zod configuration validation, non-root runtime image user, generic 5xx response masking, and Pino logging.

These are baseline controls, not a complete security posture. Rate limiting is process-local; neither API nor Socket.IO authenticates callers; Redis and Mongo are publicly published through Compose; and no judge execution exists to assess as safe.

## Deployment readiness

**Not production ready.** Compose is a local-development topology, despite restart policies. `Dockerfile` uses `npm install --omit=dev` without a committed lockfile, container images use mutable tags, API/worker lack healthchecks and graceful termination, secrets are file-based, exposed database ports are unprotected, and no CI/CD or production platform config exists.

## Production audit

### Critical issues

| Severity | Finding | Evidence / impact | Exact remediation |
|---|---|---|---|
| Critical | Default JWT secret is accepted in production | `src/config/env.js` supplies a known fallback; future auth could issue forgeable tokens | Make secret mandatory in production, load it from a secret manager, add validation tests |
| Critical | No product implementation | No user/problem/submission models or domain routes; platform cannot serve claimed use case | Implement core schemas, auth, problem/submission APIs, and persistence before release |
| Critical | No queue/judge implementation | BullMQ and runner directories are unused; no online judge operation exists | Implement idempotent BullMQ pipeline and hardened Docker sandbox with tests |
| Critical | Non-reproducible image build | Dockerfile uses `npm install` and package-lock is absent | Commit lockfile; use `npm ci`; pin base/service images for releases |
| Critical | Data services exposed | Compose publishes `27017` and `6379`, with no Redis auth/TLS configuration | Use private networks/managed services, credentials/TLS, security groups, and backups |

### Security issues

| Severity | Finding | Evidence / impact | Exact remediation |
|---|---|---|---|
| High | No HTTP or Socket.IO authentication/authorization | No middleware/routes; Socket.IO has no auth callback | Implement JWT lifecycle, RBAC middleware, Socket.IO handshake validation and authorization |
| High | Rate limit is local to each API process | Default express-rate-limit memory store does not coordinate replicas | Use Redis store, per-route policies, and deliberate proxy configuration |
| High | No secure execution implementation | Planned sandbox only appears in documents | Before code execution, enforce isolated non-root/no-network/read-only/capped containers and cleanup |
| Medium | No request schemas beyond environment | No route payload validation or Mongo sanitization exists | Validate every request with Zod; sanitize/allowlist query/data shapes |
| Medium | No dependency/secret scanning | No CI configuration exists | Add Dependabot/Renovate, npm audit, CodeQL, secret scanning, SBOM/image scan |

### Scalability issues

| Severity | Finding | Evidence / impact | Exact remediation |
|---|---|---|---|
| High | Queue and horizontal work distribution are absent | Worker only emits one shared heartbeat | Implement BullMQ workers, controlled concurrency, retries, DLQ, and per-worker liveness |
| High | Rate-limit state is not distributed | Limits reset or diverge across API replicas | Back rate limits with Redis |
| Medium | No cache policy or database indexes | No models/indexes/cache behavior yet | Define data access patterns, compound indexes, TTLs/invalidation, and pagination before domain release |
| Medium | Global heartbeat cannot represent a fleet | One worker can mask other dead workers | Track worker IDs/heartbeats and queue consumer metrics |

### Reliability issues

| Severity | Finding | Evidence / impact | Exact remediation |
|---|---|---|---|
| High | No graceful shutdown | `server.js`/`worker/index.js` do not close resources on signals | Add SIGTERM/SIGINT drain and close logic with tests |
| High | Missing monitoring/metrics/tracing | Logs are local only; no metrics/exporter/alerts | Add OpenTelemetry/Prometheus and centralized logs/alerts/runbooks |
| Medium | Connection lifecycle is minimal | Startup timeout exists only for Mongo selection; no explicit reconnect/backoff policy | Define retry/backoff/failure policy and instrument connection events |
| Medium | Test coverage is minimal | Two health tests only | Add domain, auth, worker, integration, sandbox, load, and E2E test suites with thresholds |

## Missing enterprise capabilities

No admin domain, audit log, data-retention controls, user management, tenancy model, RBAC, account recovery, notifications, API versioning, OpenAPI contract, migration process, backup/restore verification, feature flags, CI/CD, vulnerability management, SLOs, tracing, metrics, alerting, auditability, or incident runbooks are implemented. These should be added according to the priority in [PRODUCTION_READY_CHECKLIST.md](PRODUCTION_READY_CHECKLIST.md).

## Scores (current implementation)

| Dimension | Score | Rationale |
|---|---:|---|
| Overall project | 2/10 | Coherent initial foundation but core product is absent |
| Production readiness | 1/10 | Local Compose only; critical secrets, data-service exposure, reproducibility, and observability gaps |
| Security | 3/10 | Baseline HTTP protections, but no identity/security operations and unsafe deployment topology |
| Scalability | 2/10 | Stateless API intent and Redis exist, but no distributed queue/cache/data design in code |
| Maintainability | 5/10 | Small, readable modular codebase with config validation and test injection; no domain structure yet |
| Deployment readiness | 2/10 | Docker artifacts exist, but are not release hardened |
| Recruiter impression | 3/10 | Good architectural intent and clean starter conventions; claims must be carefully scoped to implemented reality |

## Final recommendations

**What is good:** ES modules, explicit configuration, request/error logging, health dependency injection, separation of API/worker entry points, baseline HTTP hardening, and a clear local Compose topology.

**What should improve:** replace roadmap claims with implemented capabilities incrementally; prioritize secrets, lifecycle, data isolation, authentication, schemas, and observability before feature breadth.

**What should be removed:** no source code needs removal. Remove or relabel unimplemented “AI-powered”, “queue-driven”, “isolated Docker workers”, and complete judge claims in external descriptions until corresponding code is delivered.

**What should be added:** all checklist items, starting with production configuration/secrets/shutdown/lockfile, then auth and schemas, then the secured queue-and-sandbox submission pipeline.

**Exact production path:** (1) install Node and generate/commit a lockfile; (2) require production secrets and add graceful shutdown; (3) move Mongo/Redis off public Compose ports with authentication/TLS/backups; (4) add CI, scans, metrics, and alerts; (5) implement auth/RBAC and validated schemas; (6) implement queues and sandbox with adversarial tests; (7) only then deploy behind TLS, private networking, managed data stores, and staged rollout controls.
