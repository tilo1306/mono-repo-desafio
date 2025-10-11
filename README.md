# 🚀 Sistema de Gestão de Tarefas Colaborativo

## 📋 Como executar o projeto

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 18+ (para desenvolvimento local)

### 🐳 Executando com Docker (Recomendado para avaliação)

```bash
# Subir todos os serviços (inclui migrações automáticas)
docker-compose up -d --build

# Ver logs dos serviços
docker-compose logs -f

# Parar todos os serviços
docker-compose down
```

### 🔧 Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Subir apenas os bancos de dados
docker-compose up -d db rabbitmq

# Executar migrações
pnpm migration:run

# Executar todos os serviços em modo desenvolvimento
pnpm dev
```

## 🌐 URLs dos Serviços

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Auth Service**: http://localhost:3002
- **Tasks Service**: http://localhost:3003
- **Notifications Service**: http://localhost:3004
- **PostgreSQL**: localhost:5432
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)

## 📊 Migrações Automáticas

As migrações são executadas automaticamente quando os serviços sobem via Docker. Cada serviço executa suas próprias migrações na inicialização.

### Comandos de Migração (Desenvolvimento)

```bash
# Executar todas as migrações
pnpm migration:run

# Gerar nova migração
pnpm migration:generate

# Reverter última migração
pnpm migration:revert
```

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes unitários
pnpm test:unit

# Executar testes e2e
pnpm test:e2e

# Executar testes com cobertura
pnpm test:cov
```
