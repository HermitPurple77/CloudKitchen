# ── Stage 1: install production deps ─────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# ── Stage 2: final runtime image ─────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# Non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy backend + installed modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy frontend static files (served by Express)
COPY frontend/ ./frontend/

USER appuser

EXPOSE 8000

ENV NODE_ENV=production
ENV PORT=8000
ENV STATIC_DIR=/app/frontend

CMD ["node", "backend/server.js"]
