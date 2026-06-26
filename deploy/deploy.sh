#!/bin/bash
set -e

echo "=== Xpand Deployment ==="

cd "$(dirname "$0")/.."

if [ ! -f deploy/.env ]; then
  echo "ERROR: deploy/.env file not found."
  echo "Create it with: cp deploy/.env.example deploy/.env"
  exit 1
fi

export $(grep -v '^#' deploy/.env | xargs)

echo "Building production image..."
docker compose -f deploy/docker-compose.yml build

echo "Running database migrations..."
docker compose -f deploy/docker-compose.yml run --rm xpand npx prisma migrate deploy

echo "Starting services..."
docker compose -f deploy/docker-compose.yml up -d

echo ""
echo "Xpand is running at http://localhost:3000"
echo "View logs: docker compose -f deploy/docker-compose.yml logs -f"
