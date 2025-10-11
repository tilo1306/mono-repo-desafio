
FROM node:22-alpine AS base
WORKDIR /repo

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

COPY packages/*/package.json packages/*/
COPY apps/api-gateway/package.json apps/api-gateway/

FROM base AS pruner

RUN pnpm dlx turbo@latest prune api-gateway --docker


FROM node:22-alpine AS installer
WORKDIR /repo
RUN corepack enable

COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

FROM installer AS builder

COPY --from=pruner /repo/out/full/ ./
 
RUN pnpm -w --filter api-gateway... build

FROM node:22-alpine AS api-gateway
WORKDIR /app
RUN corepack enable

COPY --from=installer /repo/node_modules /app/node_modules

COPY --from=builder /repo/apps/api-gateway/package.json /app/apps/api-gateway/package.json
COPY --from=builder /repo/apps/api-gateway/dist /app/apps/api-gateway/dist

ENV NODE_ENV=production
ENV SERVICE_NAME=api-gateway
ENV PORT=3001
ENV HOST=0.0.0.0

# Expor porta e startar
WORKDIR /app/apps/api-gateway
EXPOSE 3001
CMD ["node", "dist/main.js"]
