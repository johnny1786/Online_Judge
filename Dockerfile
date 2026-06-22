FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S ojx && adduser -S ojx -G ojx
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=ojx:ojx package.json ./
COPY --chown=ojx:ojx src ./src
COPY --chown=ojx:ojx worker ./worker
USER ojx
EXPOSE 3000
CMD ["node", "src/server.js"]
