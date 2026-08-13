#!/usr/bin/env bash
# Собирает прод-версию статического фронта в ./dist
#   - главная: design3.html → index.html
#   - переписывает ссылки design3.html → index.html
#   - НЕ включает прототипы (index=Дизайн1, design2, design4)
# Запуск: bash deploy/build-frontend.sh   (из корня проекта)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

PAGES="tours tour foreign baikonur launch individual about reviews contacts hotels cruises terms admin"

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
cp "$ROOT/og-cover.jpg" "$DIST/og-cover.jpg"     # картинка превью ссылок
cp "$ROOT/robots.txt" "$DIST/robots.txt"

# Переписать внутренние ссылки на главную: design3.html → «/»
# Файл остаётся index.html (его отдаёт nginx), но в адресной строке его не видно.
#
# Через find, а не grep|xargs: grep без совпадений возвращает код 1, и при
# set -o pipefail это обрывало сборку до копирования файлов.
# (GNU sed — на Ubuntu/сервере; на macOS используйте: sed -i '' ...)
find "$DIST" -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' \) -print0 \
  | xargs -0 sed -i -e 's|href="design3\.html"|href="/"|g' -e 's|design3\.html|/|g'

# Красивые адреса внутренних страниц: tours.html → /tours.
# Затрагиваем и .js — там собираются ссылки вида 'tour.html?slug=' + slug.
# admin.html не трогаем: он живёт на поддомене панели и отдаётся как «/».
CLEAN_PAGES="tours tour foreign baikonur launch individual about reviews contacts hotels cruises terms"
SED_ARGS=""
for p in $CLEAN_PAGES; do
  SED_ARGS="$SED_ARGS -e s|${p}\.html|/${p}|g"
done
# shellcheck disable=SC2086
find "$DIST" -type f \( -name '*.html' -o -name '*.js' \) -print0 \
  | xargs -0 sed -i $SED_ARGS

# Подстраховка: в собранном фронте не должно остаться ни design3.html, ни index.html в ссылках
if grep -rq 'design3\.html' "$DIST" || grep -rq 'href="index\.html"' "$DIST"; then
  echo "✗ В dist остались ссылки на design3.html или index.html:" >&2
  grep -rn 'design3\.html\|href="index\.html"' "$DIST" >&2
  exit 1
fi

# --- Версия ассетов -------------------------------------------------------
# nginx отдаёт js/css с Cache-Control: immutable на 30 дней, поэтому браузер
# не перезапрашивает их даже после выкатки. Дописываем к адресам ?v=<версия>,
# чтобы каждая сборка получала новый URL и правки доходили до пользователей.
VER="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || date +%s)"

find "$DIST" -type f -name '*.html' -print0 \
  | xargs -0 sed -i -E "s|(src=\"assets/[a-zA-Z0-9_.-]+\.js)\"|\1?v=$VER\"|g; s|(href=\"assets/[a-zA-Z0-9_.-]+\.css)\"|\1?v=$VER\"|g"

STAMPED="$(grep -ro "?v=$VER" "$DIST" | wc -l)"
if [ "$STAMPED" -eq 0 ]; then
  echo "✗ Не удалось проставить версию ассетов" >&2
  exit 1
fi

echo "✓ Версия ассетов: $VER (проставлена в $STAMPED ссылках)"
echo "✓ Прод-фронт собран в: $DIST"
echo "  Скопируйте его содержимое в public/ Laravel:"
echo "    sudo cp -R $DIST/. /var/www/turanasia/public/"
