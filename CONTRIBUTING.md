# Contributing to OJX

## Before starting

Read [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md) and [PRODUCTION_READY_CHECKLIST.md](PRODUCTION_READY_CHECKLIST.md). This repository is an early foundation; a feature should not claim to be implemented merely because its package dependency or planned directory exists.

## Development workflow

1. Create a focused branch from `main`.
2. Add or update tests with the behavior change.
3. Run `npm run lint` and `npm test`.
4. Update API, environment, and architecture documentation if externally visible behavior changes.
5. Open a pull request with purpose, test evidence, migrations/configuration changes, and operational impact.

## Code standards

- Use JavaScript ES modules and Node 20-compatible APIs.
- Keep controllers thin; place infrastructure in `src/config`, domain orchestration in `src/services`, and queue consumers in `worker/processors`.
- Validate external input at the route boundary.
- Never commit secrets, test cases for private problems, generated coverage, or `node_modules`.
- Avoid logging tokens, passwords, source code, or personal information.

## Pull request checklist

- [ ] Tests added or updated.
- [ ] Lint and tests pass locally.
- [ ] Error paths and authorization were considered.
- [ ] New environment variables are documented in `.env.example` and README.
- [ ] Database migrations/indexes and rollback approach are documented, if applicable.
