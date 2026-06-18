# Деплой Turan Asia — Ubuntu VPS + Nginx

Фронт (статика + админка) и бэкенд (Laravel API + PostgreSQL) на одном сервере и домене.

**Что разворачиваем сейчас:** статический сайт (выбранный Дизайн 3 + внутренние страницы), рабочая админка (подключена к API) и сам API.
**Пока не подключено:** формы публичного сайта к API (это следующий этап — интеграция фронта).

Предполагаемые пути: код — `/var/www/turanasia`, домен — `turan-asia.kz` (замените на свой).

---

## 1. Подготовка сервера (Ubuntu 22.04/24.04)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx postgresql git unzip curl \
  php8.3-fpm php8.3-cli php8.3-pgsql php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-zip php8.3-gd php8.3-bcmath php8.3-intl

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```
> Проверьте версию PHP (`php -v`) и при необходимости поправьте сокет в `nginx-turanasia.conf` (`php8.3-fpm.sock`).

## 2. PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE turanasia;
CREATE USER turanasia WITH PASSWORD 'СИЛЬНЫЙ_ПАРОЛЬ';
GRANT ALL PRIVILEGES ON DATABASE turanasia TO turanasia;
ALTER DATABASE turanasia OWNER TO turanasia;
SQL
```

## 3. Код бэкенда

Загрузите проект на сервер (git clone или scp). Бэкенд Laravel разворачивается из папки `backend/`
по инструкции `backend/README.md` (наложение на свежий каркас Laravel 11), итог — в `/var/www/turanasia`.

```bash
cd /var/www/turanasia
composer install --no-dev --optimize-autoloader
```

## 4. Настройка приложения

```bash
cp .env.production .env          # шаблон лежит в backend/.env.production
php artisan key:generate
# впишите в .env: DB_PASSWORD, APP_URL, FRONTEND_URL, MAIL_*, MANAGER_EMAIL

php artisan migrate --force
# роли + учётки сотрудников (без демо-данных):
php artisan db:seed --class=Database\\Seeders\\RolePermissionSeeder --force
php artisan db:seed --class=Database\\Seeders\\UserSeeder --force
# (если нужен демо-контент для показа — php artisan db:seed --force)

php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan view:cache

# Права
sudo chown -R www-data:www-data /var/www/turanasia
sudo chmod -R 775 storage bootstrap/cache
```

## 5. Сборка и размещение фронта

На машине с проектом:
```bash
bash deploy/build-frontend.sh         # соберёт ./dist (Дизайн 3 → index.html)
```
Скопируйте содержимое `dist/` в `public/` Laravel на сервере:
```bash
sudo cp -R dist/. /var/www/turanasia/public/
sudo rm -f /var/www/turanasia/public/robots.txt   # чтобы работал динамический /robots.txt
sudo chown -R www-data:www-data /var/www/turanasia/public
```
> Админка автоматически использует API того же домена (`/api/v1`) — отдельная настройка не нужна.

## 6. Nginx

```bash
sudo cp deploy/nginx-turanasia.conf /etc/nginx/sites-available/turanasia
sudo ln -s /etc/nginx/sites-available/turanasia /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7. SSL (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d turan-asia.kz -d www.turan-asia.kz
```

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 9. Обязательно после деплоя (безопасность)

- **Смените дефолтные пароли** учёток админки! После сидера созданы `admin@turan-asia.kz` и `aigerim@turan-asia.kz` с паролем `password`. Войдите и поменяйте (или измените сидер до запуска).
- Убедитесь, что `APP_DEBUG=false` и `APP_ENV=production`.
- Проверьте, что `.env` недоступен извне (Nginx уже блокирует скрытые файлы; `.env` лежит вне `public/`).
- Настройте реальный SMTP (`MAIL_*`), иначе уведомления о заявках не уйдут.
- Настройте регулярный бэкап БД (например, `pg_dump` по cron).

## 10. Проверка

- `https://turan-asia.kz/` — главная (Дизайн 3), переход по меню, тёмная тема.
- `https://turan-asia.kz/admin.html` — вход в админку, дашборд, CRUD, загрузка фото.
- `https://turan-asia.kz/api/v1/tours` — JSON каталога.
- `https://turan-asia.kz/sitemap.xml` и `/robots.txt`.

## 11. Обновление (re-deploy)

```bash
cd /var/www/turanasia
git pull                      # или загрузка новых файлов
composer install --no-dev --optimize-autoloader
php artisan migrate --force
bash deploy/build-frontend.sh && sudo cp -R dist/. public/
php artisan config:cache && php artisan route:cache && php artisan view:cache
sudo systemctl reload php8.3-fpm nginx
```

## 12. Опционально: очередь (на будущее)

Уведомления сейчас отправляются синхронно. Если переведёте их в очередь (`ShouldQueue`),
поднимите воркер через systemd/supervisor:
```bash
php artisan queue:work --daemon
```
