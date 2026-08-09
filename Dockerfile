# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build

# Stage 2: Production Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 3: Production Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S ojx && adduser -S ojx -G ojx
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=ojx:ojx package*.json ./
COPY --chown=ojx:ojx src ./src
COPY --chown=ojx:ojx worker ./worker
COPY --from=frontend-builder --chown=ojx:ojx /app/frontend/dist ./frontend/dist
USER ojx
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
