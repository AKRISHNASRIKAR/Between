# Love Notes API — build from the repo root:  docker build -f apps/api/Dockerfile -t lovenotes-api .
FROM oven/bun:1.3-slim AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
RUN bun install --production --ignore-scripts

FROM oven/bun:1.3-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bunfig.toml tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY content ./content
COPY apps/api ./apps/api
WORKDIR /app/apps/api
USER bun
EXPOSE 3000
# Apply pending migrations, then serve. Quiz content syncs on boot.
CMD ["sh", "-c", "bun src/db/migrate.ts && bun src/index.ts"]
