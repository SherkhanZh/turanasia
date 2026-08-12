#!/usr/bin/env bash
# Собирает прод-версию статического фронта в ./dist
#   - главная: design3.html → index.html
#   - переписывает ссылки design3.html → index.html
#   - НЕ включает прототипы (index=Дизайн1, design2, design4)
# Запуск: bash deploy/build-frontend.sh   (из корня проекта)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

PAGES="tours tour foreign baikonur launch individual about reviews contacts hotels cruises admin"

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
cp "$ROOT/Turanasia-logo.png" "$DIST/Turanasia-logo.png"
cp "$ROOT/robots.txt" "$DIST/robots.txt"

# Переписать внутренние ссылки на главную: design3.html → «/»
# Файл остаётся index.html (его отдаёт nginx), но в адресной строке его не видно.
#
# Через find, а не grep|xargs: grep без совпадений возвращает код 1, и при
# set -o pipefail это обрывало сборку до копирования файлов.
# (GNU sed — на Ubuntu/сервере; на macOS используйте: sed -i '' ...)
find "$DIST" -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' \) -print0 \
  | xargs -0 sed -i -e 's|href="design3\.html"|href="/"|g' -e 's|design3\.html|/|g'

# Подстраховка: в собранном фронте не должно остаться ни design3.html, ни index.html в ссылках
if grep -rq 'design3\.html' "$DIST" || grep -rq 'href="index\.html"' "$DIST"; then
  echo "✗ В dist остались ссылки на design3.html или index.html:" >&2
  grep -rn 'design3\.html\|href="index\.html"' "$DIST" >&2
  exit 1
fi

echo "✓ Прод-фронт собран в: $DIST"
echo "  Скопируйте его содержимое в public/ Laravel:"
echo "    sudo cp -R $DIST/. /var/www/turanasia/public/"
