#!/usr/bin/env bash
# Nightly MySQL backup. Credentials come from ~/.my.cnf (chmod 600), not from this file.
# Keeps 14 days locally. Copy the folder off the server too (see docs/DEPLOYMENT.md).
set -euo pipefail
DIR=/var/backups/drrmo
DB=${DB_DATABASE:-drrmo_eams}
mkdir -p "$DIR"
FILE="$DIR/$DB-$(date +%Y%m%d-%H%M).sql.gz"
mysqldump --single-transaction --quick --routines "$DB" | gzip > "$FILE"
chmod 600 "$FILE"
find "$DIR" -name "*.sql.gz" -mtime +14 -delete
echo "Backup written: $FILE"
