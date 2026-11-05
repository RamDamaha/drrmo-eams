#!/usr/bin/env bash
# One-command local setup with Laravel Sail.
# Run inside WSL2 (Ubuntu) on Windows, or on macOS/Linux, with Docker Desktop running:
#   bash scripts/setup.sh
set -euo pipefail

command -v docker >/dev/null || { echo "Docker is not available. Start Docker Desktop and enable WSL integration."; exit 1; }

[ -f .env ] || cp .env.example .env

if [ ! -d vendor ]; then
  echo "Installing PHP packages (first run takes a few minutes)..."
  docker run --rm -u "$(id -u):$(id -g)" -v "$(pwd):/var/www/html" -w /var/www/html \
    laravelsail/php83-composer:latest composer install --ignore-platform-reqs
fi

./vendor/bin/sail up -d
echo "Waiting for MySQL..."
until ./vendor/bin/sail exec -T mysql mysqladmin ping -ppassword --silent >/dev/null 2>&1; do sleep 2; done

grep -q '^APP_KEY=base64' .env || ./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm install
./vendor/bin/sail npm run build

echo
echo "Ready."
echo "  App:      http://localhost"
echo "  Mailpit:  http://localhost:8025"
echo "  Dev mode: ./vendor/bin/sail npm run dev"
