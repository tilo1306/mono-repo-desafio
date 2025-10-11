FROM node:22-alpine AS base

WORKDIR /repo

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/*/package.json packages/*/
COPY apps/tasks-service/package.json apps/tasks-service/

RUN pnpm install --frozen-lockfile

FROM base AS builder

COPY packages ./packages
COPY apps ./apps

RUN pnpm -w --filter tasks-service... build

FROM node:22-alpine AS tasks-service

WORKDIR /app

RUN corepack enable

COPY --from=base /repo/node_modules /app/node_modules
COPY --from=builder /repo/apps/tasks-service/package.json /app/apps/tasks-service/package.json
COPY --from=builder /repo/apps/tasks-service/dist /app/apps/tasks-service/dist

ENV NODE_ENV=production
ENV SERVICE_NAME=tasks-service
ENV PORT=3003
ENV HOST=0.0.0.0

WORKDIR /app/apps/tasks-service

EXPOSE 3003

CMD ["node", "dist/main.js"]
