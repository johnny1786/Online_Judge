# Architecture Diagrams

All diagrams label whether they depict current implementation or an absent flow. They do not turn planned dependencies into implemented features.

## 1. Current system architecture

```mermaid
flowchart LR
  Caller --> API[Express API :3000]
  API --> M[(MongoDB)]
  API --> R[(Redis)]
  Worker[Heartbeat worker] --> M
  Worker --> R
  Worker -- SET ojx:worker:heartbeat EX 30 --> R
  API -- EXISTS heartbeat --> R
  API --- S[Socket.IO server: initialized, no handlers]
```

## 2. Authentication flow

```mermaid
flowchart LR
  User[User] --> Missing[Not implemented]
  Missing --> NoRoutes[No signup/login routes]
  Missing --> NoMiddleware[No JWT verification or RBAC]
  Missing --> NoStore[No user schema or token store]
```

`JWT_SECRET` and `JWT_EXPIRES_IN` exist in configuration, but no request currently uses them.

## 3. Current API flow

```mermaid
sequenceDiagram
  participant C as Caller
  participant E as Express middleware
  participant H as Health controller
  participant R as Redis
  C->>E: GET /health
  E->>E: log, Helmet, CORS, body limit, rate limit
  E->>H: route handler
  H->>R: EXISTS heartbeat
  H-->>C: 200 ok or 503 degraded
```

All non-health paths receive a JSON 404. Errors receive the generic JSON error response.

## 4. Database flow

```mermaid
flowchart LR
  Server --> Connect[mongoose.connect(MONGODB_URI)] --> Mongo[(MongoDB)]
  Worker --> Connect
  Health --> State[mongoose.connection.readyState]
  State --> Response[/health/db response]
```

There are no model, collection, read, write, migration, or transaction flows.

## 5. Worker flow

```mermaid
sequenceDiagram
  participant P as Worker process
  participant M as MongoDB
  participant R as Redis
  P->>M: connect
  P->>R: connect + PING
  P->>R: SET ojx:worker:heartbeat timestamp EX 30
  loop 10 seconds
    P->>R: refresh key
  end
```

BullMQ is not imported or initialized, so there is no job flow.

## 6. Document processing / file storage flow

```mermaid
flowchart LR
  Request[Requested document/file flow] --> Absent[Not implemented]
  Absent --> NoUpload[No upload endpoint]
  Absent --> NoStorage[No storage provider or bucket]
  Absent --> NoProcessing[No processing service]
```

## 7. Deployment architecture

```mermaid
flowchart TB
  Compose[docker compose] --> API[api container]
  Compose --> Worker[worker container]
  Compose --> Mongo[mongo:8.0 container]
  Compose --> Redis[redis:7.4-alpine container]
  Host[Host ports] --> API
  Host --> Mongo
  Host --> Redis
  API --> Mongo
  API --> Redis
  Worker --> Mongo
  Worker --> Redis
```

This is a local development deployment, not a secure production topology: MongoDB and Redis are mapped to host ports, images use tags rather than digests, and API/worker lack Compose health checks.
