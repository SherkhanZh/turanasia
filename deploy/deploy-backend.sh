#!/usr/bin/env bash
# Выкатывает бэкенд из git-клона в рабочую директорию Laravel.
# Синхронизирует ВЕСЬ код (app, routes, config, database, bootstrap, resources),
# не трогая .env, storage/ и vendor/ — там прод-данные и зависимости.
#
# Запуск на сервере:  sudo bash deploy/deploy-backend.sh
set -euo pipefail

SRC="$(cd "$(dirname "$0")/../backend" && pwd)"
DST="${TURANASIA_ROOT:-/var/www/turanasia}"
WEBUSER="${TURANASIA_USER:-www-data}"

[ -d "$DST" ] || { echo "✗ Не найдена директория $DST"; exit 1; }
[ -f "$DST/.env" ] || { echo "✗ Нет $DST/.env — сначала настройте окружение"; exit 1; }

echo "→ Синхронизация кода: $SRC → $DST"
rsync -a --delete \
  --exclude '.env' \
  --exclude 'storage/' \
  --exclude 'vendor/' \
  --exclude 'public/' \
  --exclude 'bootstrap/cache/' \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  "$SRC/" "$DST/"

# Laravel не запустится без этих директорий, а в git они пустые
mkdir -p "$DST/bootstrap/cache" \
         "$DST/storage/framework/"{cache/data,sessions,views} \
         "$DST/storage/logs"

chown -R "$WEBUSER":"$WEBUSER" "$DST/app" "$DST/routes" "$DST/config" "$DST/database" "$DST/bootstrap" "$DST/storage"
chmod -R 775 "$DST/bootstrap/cache" "$DST/storage"

cd "$DST"

# Зависимости — только если изменился composer.lock
if [ -f composer.lock ]; then
  echo "→ composer install"
  sudo -u "$WEBUSER" composer install --no-dev --optimize-autoloader --no-interaction
fi

# Сначала сброс — иначе artisan прочитает устаревший закэшированный конфиг
echo "→ Сброс кэшей"
sudo -u "$WEBUSER" php artisan optimize:clear

echo "→ Миграции"
sudo -u "$WEBUSER" php artisan migrate --force

# config:cache намеренно не используем: при неудачном разборе .env он кладёт прод.
# route:cache безопасен и даёт основной выигрыш.
echo "→ Кэш маршрутов"
sudo -u "$WEBUSER" php artisan route:cache

systemctl reload php8.3-fpm 2>/dev/null || true

echo "✓ Бэкенд выкачен. Маршруты туров:"
sudo -u "$WEBUSER" php artisan route:list --path=tours || true
