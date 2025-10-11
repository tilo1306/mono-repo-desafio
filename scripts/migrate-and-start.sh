#!/bin/bash

# Script para executar migrações automaticamente
echo "🚀 Running database migrations..."

# Função para aguardar o banco estar pronto
wait_for_db() {
  echo "⏳ Waiting for database to be ready..."
  until pg_isready -h ${DB_HOST:-db} -p ${DB_PORT:-5432} -U ${DB_USERNAME:-postgres} -d ${DB_NAME:-challenge_db}; do
    echo "Database is unavailable - sleeping"
    sleep 2
  done
  echo "✅ Database is ready!"
}

# Executa migrações se for o primeiro serviço a subir
if [ "${SERVICE_NAME}" = "auth-service" ]; then
  wait_for_db
  echo "📦 Running auth-service migrations..."
  pnpm migration:run
  echo "✅ Auth-service migrations completed"
elif [ "${SERVICE_NAME}" = "tasks-service" ]; then
  wait_for_db
  echo "📦 Running tasks-service migrations..."
  pnpm migration:run
  echo "✅ Tasks-service migrations completed"
elif [ "${SERVICE_NAME}" = "notifications-service" ]; then
  wait_for_db
  echo "📦 Running notifications-service migrations..."
  pnpm migration:run
  echo "✅ Notifications-service migrations completed"
fi

echo "🎉 Migrations check completed!"
