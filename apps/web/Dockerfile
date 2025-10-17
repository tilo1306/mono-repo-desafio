FROM node:22-alpine AS base
WORKDIR /repo
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/web/package.json apps/web/

FROM base AS pruner
RUN pnpm dlx turbo@latest prune web --docker

FROM node:22-alpine AS installer
WORKDIR /repo
RUN corepack enable
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

FROM installer AS builder
COPY --from=pruner /repo/out/full/ ./
COPY apps/web/tsconfig.json apps/web/
COPY apps/web/vite.config.ts apps/web/
COPY apps/web/tsconfig.build.json apps/web/
COPY apps/web/index.html apps/web/
COPY apps/web/public apps/web/public
COPY apps/web/src apps/web/src
COPY apps/web/components.json apps/web/
WORKDIR /repo/apps/web
RUN pnpm run build

FROM node:22-alpine AS web
WORKDIR /app
RUN corepack enable

COPY --from=installer /repo /app
COPY --from=builder /repo/apps/web/dist /app/apps/web/dist

ENV NODE_ENV=production
ENV SERVICE_NAME=web
ENV PORT=3000
ENV HOST=0.0.0.0

WORKDIR /app/apps/web
EXPOSE 3000

CMD ["pnpm", "run", "serve", "--port", "3000", "--host", "0.0.0.0"]
