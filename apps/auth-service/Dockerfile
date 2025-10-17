FROM node:22-alpine AS auth-service
WORKDIR /app
RUN corepack enable && apk add --no-cache postgresql-client

# Copiar arquivos de configuração do monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages

# Copiar apenas o auth-service
COPY apps/auth-service ./apps/auth-service

# Instalar dependências
RUN pnpm install --no-frozen-lockfile

# Build dos pacotes primeiro
WORKDIR /app/packages/utils
RUN pnpm run build

WORKDIR /app/packages/types
RUN pnpm run build

# Build do auth-service
WORKDIR /app/apps/auth-service
RUN pnpm run build

# Voltar para o diretório raiz e definir o diretório de trabalho final
WORKDIR /app/apps/auth-service

ENV NODE_ENV=production
ENV SERVICE_NAME=auth-service
ENV PORT=3002
ENV HOST=0.0.0.0
ENV JWT_SECRET=secret123

EXPOSE 3002

# Executar migrações e seeds, depois iniciar o serviço
CMD ["sh", "-c", "until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME; do echo 'Aguardando PostgreSQL...'; sleep 2; done && pnpm run migration:run && pnpm run seed:users && node dist/src/main.js"]
