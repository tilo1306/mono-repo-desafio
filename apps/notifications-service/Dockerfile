
FROM node:22-alpine AS notifications-service
WORKDIR /app
RUN corepack enable && apk add --no-cache postgresql-client

# Copiar manifestos do workspace e apenas o package.json do serviço
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages

# Copiar apenas o notifications-service
COPY apps/notifications-service ./apps/notifications-service

# Instalar dependências
RUN pnpm install --no-frozen-lockfile

# Build dos pacotes primeiro
WORKDIR /app/packages/utils
RUN pnpm run build

WORKDIR /app/packages/types
RUN pnpm run build

# Build do notifications-service
WORKDIR /app/apps/notifications-service
RUN pnpm run build

# Voltar para o diretório raiz e definir o diretório de trabalho final
WORKDIR /app/apps/notifications-service

ENV NODE_ENV=production
ENV SERVICE_NAME=notifications-service
ENV PORT=3004
ENV HOST=0.0.0.0
ENV DB_HOST=db
ENV DB_PORT=5432
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=password
ENV DB_NAME=challenge_db
ENV RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
ENV NOTIFICATIONS_SERVICE_TCP_PORT=3005

EXPOSE 3004


# Executar migrações e iniciar o serviço
CMD ["sh", "-c", "until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME; do echo 'Aguardando PostgreSQL...'; sleep 2; done && pnpm run migration:run && node dist/main.js"]
