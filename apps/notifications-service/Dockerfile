
FROM node:22-alpine AS base

WORKDIR /repo

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/*/package.json packages/*/
COPY apps/notifications-service/package.json apps/notifications-service/

RUN pnpm -w install --frozen-lockfile --filter notifications-service...

FROM base AS builder

COPY packages ./packages
COPY apps ./apps

RUN pnpm -w --filter notifications-service... build

FROM node:22-alpine AS notifications-service

WORKDIR /app

RUN corepack enable

COPY --from=base /repo/node_modules /app/node_modules
COPY --from=builder /repo/apps/notifications-service/package.json /app/apps/notifications-service/package.json
COPY --from=builder /repo/apps/notifications-service/dist /app/apps/notifications-service/dist

ENV NODE_ENV=production
ENV SERVICE_NAME=notifications-service
ENV PORT=3004
ENV HOST=0.0.0.0

WORKDIR /app/apps/notifications-service
EXPOSE 3004

CMD ["node", "dist/main.js"]
