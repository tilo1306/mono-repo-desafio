FROM node:22-alpine AS base
WORKDIR /repo

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/auth-service/package.json apps/auth-service/

RUN pnpm install --no-frozen-lockfile

FROM base AS builder

COPY packages ./packages
COPY apps ./apps

RUN pnpm -w --filter auth-service... build

FROM node:22-alpine AS auth-service
WORKDIR /app
RUN corepack enable

COPY --from=base /repo/node_modules /app/node_modules

COPY --from=builder /repo/apps/auth-service/package.json /app/apps/auth-service/package.json

COPY --from=builder /repo/apps/auth-service/dist /app/apps/auth-service/dist

ENV NODE_ENV=production
ENV SERVICE_NAME=auth-service
ENV PORT=3002
ENV HOST=0.0.0.0

WORKDIR /app/apps/auth-service
EXPOSE 3002

CMD ["node", "dist/main.js"]
