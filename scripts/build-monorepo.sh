#!/bin/bash

# Script para build otimizado do monorepo com Docker

set -e

echo "🏗️  Building monorepo with Docker..."

# Build usando docker-compose (mais eficiente)
echo "🚀 Building all services with docker-compose..."
docker compose -f docker-compose.monorepo.yml build

echo "✅ All services built successfully!"
echo ""
echo "🚀 To start all services:"
echo "   docker compose -f docker-compose.monorepo.yml up -d"
echo ""
echo "🔍 To start individual services:"
echo "   docker compose -f docker-compose.monorepo.yml up -d api-gateway auth-service"
echo ""
echo "📊 To see logs:"
echo "   docker compose -f docker-compose.monorepo.yml logs -f"
