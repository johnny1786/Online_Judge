# Data model roadmap

Phase 1 creates infrastructure only; no mutable product collection exists yet. Subsequent collections and core indexes are defined here to keep ownership clear.

| Collection | Purpose | Key indexes |
|---|---|---|
| users | identity, roles, rating, profile | `email` unique; `rating` desc |
| problems | authored/published programming challenges | `slug` unique; `status,difficulty,tags` |
| submissions | immutable execution records | `userId,createdAt`; `problemId,verdict`; `contestId,userId` |
| contests | schedules, rules, registrations | `startAt,endAt`; `slug` unique |
| discussions | problem threads/comments | `problemId,createdAt`; `parentId` |
| notifications | per-user delivery state | `userId,readAt,createdAt` |
| plagiarismReports | similarity review workflow | `submissionId`; `status,score` |

Submission test cases are stored as encrypted/private fields on `problems`; only public examples are exposed through normal problem APIs.
