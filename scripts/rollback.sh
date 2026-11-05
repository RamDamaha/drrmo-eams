#!/usr/bin/env bash
# Points "current" back to the previous release. Does not undo migrations.
set -euo pipefail
APP=/var/www/drrmo
PREVIOUS=$(ls -1dt "$APP"/releases/* | sed -n 2p)
[ -n "$PREVIOUS" ] || { echo "No previous release found"; exit 1; }
ln -sfn "$PREVIOUS" "$APP/current"
sudo systemctl reload php8.3-fpm
cd "$APP/current" && php artisan queue:restart
echo "Rolled back to $PREVIOUS"
