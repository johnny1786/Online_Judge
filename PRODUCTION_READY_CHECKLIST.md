# Production Readiness Checklist

This checklist is derived from the current source tree. Completion requires code and operational evidence, not only configuration intent.

## Critical blockers

- [ ] **[Critical] Remove the production JWT fallback.** `src/config/env.js` defaults `JWT_SECRET` even in production. Require a non-empty secret supplied by a secret manager when `NODE_ENV=production`; reject startup otherwise. Add a test for production validation.
- [ ] **[Critical] Add graceful shutdown.** Update `src/server.js` and `worker/index.js` to handle `SIGTERM`/`SIGINT`, stop accepting traffic/queue work, clear heartbeat, close HTTP/Socket.IO/Mongoose/Redis resources, and exit with a timeout.
- [ ] **[Critical] Add dependency lockfile and reproducible install.** Commit `package-lock.json`, change Dockerfile to `npm ci --omit=dev`, and pin container images by digest for release deployments.
- [ ] **[Critical] Do not deploy Compose as-is.** Place MongoDB and Redis on private networks; remove their public host-port mappings; enable Redis authentication/TLS and managed MongoDB authentication/TLS/backups.

## Security

- [ ] **[High] Implement authentication and RBAC before protected features.** Add `User` schema, password hashing, login/refresh/logout endpoints, JWT verification middleware, role checks, token rotation/revocation, and authentication tests.
- [ ] **[High] Authenticate Socket.IO.** Configure a handshake middleware, validate JWTs, bind user identity to sockets, authorize room joins, and rate-limit events in `src/server.js`.
- [ ] **[High] Replace in-memory rate limiting.** Use a Redis-backed rate-limit store, key by trusted client identity, configure proxy trust deliberately, and use stricter per-route limits for authentication and expensive endpoints.
- [ ] **[High] Configure CORS safely.** Validate origins against an explicit production allowlist and test rejected origins; do not use a broad environment value in production.
- [ ] **[High] Harden judge execution before adding it.** Create ephemeral non-root Docker containers with network disabled, read-only filesystem, dropped capabilities, `no-new-privileges`, CPU/memory/PID limits, wall-clock timeout, output limit, and mandatory cleanup. Never execute source code in the worker process.
- [ ] **[Medium] Add payload validation and sanitization per route.** Use Zod request schemas, Mongo query sanitization, response allowlists, and domain-specific size limits.
- [ ] **[Medium] Add dependency vulnerability scanning and secret scanning** in CI.

## Reliability and observability

- [ ] **[High] Make startup and reconnect policy explicit.** Add Mongo/Redis retry/backoff behavior, connection event metrics, and a defined fail-fast versus degraded-mode policy.
- [ ] **[High] Instrument service behavior.** Add Prometheus/OpenTelemetry metrics and traces for HTTP, Mongo, Redis, queue latency, job outcomes, and sandbox results. Export logs to a centralized service.
- [ ] **[High] Add API/worker health checks in Compose or deployment manifests.** Liveness must check process responsiveness; readiness must include only required dependencies. Avoid using a single global Redis key as the sole worker fleet health signal.
- [ ] **[Medium] Use unique worker IDs and per-worker heartbeats.** Store `ojx:workers:<id>` with TTL and aggregate active workers; remove the key on graceful shutdown.
- [ ] **[Medium] Add alerting and runbooks** for error rate, unavailable dependencies, queue age/depth, worker count, memory/CPU, and database saturation.

## Scalability and product completion

- [ ] **[Critical] Implement schemas, indexes, and migrations** before any domain endpoints. A Mongo connection without models cannot deliver product data.
- [ ] **[Critical] Implement the BullMQ submission pipeline** with idempotent jobs, retry/backoff policy, dead-letter handling, concurrency limits, job cleanup, and terminal-state persistence.
- [ ] **[High] Implement cache policy.** Define keys, TTLs, invalidation, maximum values, stampede protection, and Redis memory eviction policy before caching product data.
- [ ] **[High] Implement tests beyond health routes.** Add unit, integration, contract, security, worker, sandbox, load, and end-to-end tests; enforce coverage thresholds.
- [ ] **[High] Add CI/CD.** At minimum lint, test, dependency audit, image build/scan, and publish/deploy gates. Add staged rollout and rollback procedures.
- [ ] **[Medium] Build the missing frontend or remove frontend claims** from product documentation until it exists.

## Documentation and repository hygiene

- [ ] **[Medium] Keep planned architecture clearly separated from implemented architecture.** Update `docs/architecture.md` and `docs/diagrams.md` as features land.
- [ ] **[Low] Add CODEOWNERS, issue/PR templates, a changelog, and security disclosure policy.**
