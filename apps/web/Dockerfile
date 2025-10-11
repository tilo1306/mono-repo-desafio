FROM node:22-alpine
WORKDIR /app
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../turbo.json ./
COPY ../../packages ./packages
COPY ../../apps ./apps
RUN corepack enable && pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm -w --filter web build
EXPOSE 5173
CMD ["node","dist/main.js"]
