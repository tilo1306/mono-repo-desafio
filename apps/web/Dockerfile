FROM node:20-alpine
WORKDIR /app
COPY ../../package.json ../../pnpm-lock.yaml ../../turbo.json ./
COPY ../../packages ./packages
COPY ./package.json ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["node","dist/main.js"]
