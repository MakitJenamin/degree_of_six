# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước để tận dụng Docker layer cache
COPY package*.json ./
RUN npm ci

# Copy source và build
COPY . .
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Chỉ cài production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled code từ stage builder
COPY --from=builder /app/dist ./dist

# Copy graph data vào image (file nặng, cần thiết để app chạy được)
COPY ../data/graph.json ./data/graph.json

EXPOSE 3001

CMD ["node", "dist/main.js"]
