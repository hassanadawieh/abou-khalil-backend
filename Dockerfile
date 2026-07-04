# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Required for in-app database backups (GET /api/backup)
RUN apk add --no-cache postgresql-client

COPY --from=builder /app/dist ./dist

RUN mkdir -p public/uploads/items

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 6000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]
