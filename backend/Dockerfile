FROM node:22-alpine AS builder
RUN npm install -g pnpm@11.0.8
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN npx prisma generate --schema=src/prisma/schema.prisma


# ══════════════════════════════════════════
# Stage 2 — Lean production image
# ══════════════════════════════════════════
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
RUN addgroup -S safepay && adduser -S safepay -G safepay
WORKDIR /app
COPY --from=builder /app/node_modules      ./node_modules
COPY --from=builder /app/src               ./src
COPY --from=builder /app/prisma.config.ts  ./prisma.config.ts
COPY package.json ./
COPY --chown=safepay:safepay docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
ENV NODE_ENV=production
USER safepay
EXPOSE 8000
ENTRYPOINT ["./docker-entrypoint.sh"]