# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build context = ROOT repo, nên phải chỉ rõ thư mục backend/
COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy compiled code từ stage builder
COPY --from=builder /app/dist ./dist

# Copy graph data (giờ dùng được vì context là root)
COPY data/graph.json ./data/graph.json

EXPOSE 3001

CMD ["node", "dist/main.js"]
