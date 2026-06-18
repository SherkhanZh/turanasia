#!/usr/bin/env bash
# Собирает прод-версию статического фронта в ./dist
#   - главная: design3.html → index.html
#   - переписывает ссылки design3.html → index.html
#   - НЕ включает прототипы (index=Дизайн1, design2, design4)
# Запуск: bash deploy/build-frontend.sh   (из корня проекта)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

PAGES="tours tour foreign baikonur individual about reviews contacts hotels cruises admin"

rm -rf "$DIST"
mkdir -p "$DIST/assets"

# Главная = выбранный Дизайн 3
cp "$ROOT/design3.html" "$DIST/index.html"

# Внутренние страницы + админка
for p in $PAGES; do
  cp "$ROOT/$p.html" "$DIST/$p.html"
done

# Ассеты и логотип
cp -R "$ROOT/assets/." "$DIST/assets/"
cp "$ROOT/logo_gold.png" "$DIST/logo_gold.png"

# Переписать внутренние ссылки на главную
# (GNU sed — на Ubuntu/сервере; на macOS используйте: sed -i '' ...)
grep -rl 'design3\.html' "$DIST" | xargs -r sed -i 's/design3\.html/index.html/g'

echo "✓ Прод-фронт собран в: $DIST"
echo "  Скопируйте его содержимое в public/ Laravel:"
echo "    sudo cp -R $DIST/. /var/www/turanasia/public/"
