# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# ---------- PRODUCTION STAGE ----------
FROM node:20-alpine

WORKDIR /app

# Security: Run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app /app

EXPOSE 9000

CMD ["npm", "start"]
