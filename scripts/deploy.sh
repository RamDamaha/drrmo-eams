#!/usr/bin/env bash
# Zero-fuss deploy using release folders, so rollback is one symlink change.
# Run on the server as the deploy user:  scripts/deploy.sh [branch]
# Layout:
#   /var/www/drrmo/releases/<timestamp>   each release
#   /var/www/drrmo/shared/.env            real secrets, never in git
#   /var/www/drrmo/shared/storage         uploads and logs, kept between releases
#   /var/www/drrmo/current -> releases/<timestamp>
set -euo pipefail

APP=/var/www/drrmo
REPO_URL="${REPO_URL:?Set REPO_URL, e.g. git@github.com:OWNER/drrmo-eams.git}"
BRANCH="${1:-main}"
RELEASE="$APP/releases/$(date +%Y%m%d%H%M%S)"

echo "Deploying $BRANCH to $RELEASE"
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$RELEASE"
cd "$RELEASE"

ln -s "$APP/shared/.env" .env
rm -rf storage
ln -s "$APP/shared/storage" storage

composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
npm ci
npm run build
rm -rf node_modules

php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

ln -sfn "$RELEASE" "$APP/current"
sudo systemctl reload php8.3-fpm
php artisan queue:restart

# Keep the last 5 releases.
ls -1dt "$APP"/releases/* | tail -n +6 | xargs -r rm -rf

echo "Deployed. Run the smoke test in docs/DEPLOYMENT.md."
