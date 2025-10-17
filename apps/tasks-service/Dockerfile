FROM node:22-alpine AS tasks-service
WORKDIR /app
RUN corepack enable && apk add --no-cache postgresql-client

# Copiar arquivos de configuração do monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages

# Copiar apenas o tasks-service
COPY apps/tasks-service ./apps/tasks-service

# Instalar dependências
RUN pnpm install --no-frozen-lockfile

# Build dos pacotes primeiro
WORKDIR /app/packages/utils
RUN pnpm run build

WORKDIR /app/packages/types
RUN pnpm run build

# Build do tasks-service
WORKDIR /app/apps/tasks-service
RUN pnpm run build

# Voltar para o diretório raiz e definir o diretório de trabalho final
WORKDIR /app/apps/tasks-service

ENV NODE_ENV=production
ENV SERVICE_NAME=tasks-service
ENV PORT=3003
ENV HOST=0.0.0.0

EXPOSE 3003

# Executar migrações e seeds, depois iniciar o serviço
CMD ["sh", "-c", "until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME; do echo 'Aguardando PostgreSQL...'; sleep 2; done && pnpm run migration:run && pnpm run seed:tasks && node dist/src/main.js"]
