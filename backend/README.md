# Turan Asia — Backend (Laravel 11 + PostgreSQL)

REST API и бэкенд админ-панели для сайта туристической компании Turan Asia.

## Что внутри

- **Laravel 11**, авторизация — **Sanctum** (Bearer-токены).
- **PostgreSQL**.
- **Мультиязычность** RU / KZ / EN — через `spatie/laravel-translatable` (JSON-поля).
- **2 роли** — `admin` и `content-manager` — через `spatie/laravel-permission`.
- Разделы по ТЗ: туры (Казахстан — однодневные/многодневные, зарубежные групповые), **Байконур** (запуски, FAQ, галерея — ввод вручную), направления, заявки со статусами и источником, отзывы (текст/фото/видео), баннеры, контакты, SEO, FAQ.
- Уведомления о заявках: письмо менеджеру + подтверждение клиенту.
- **Журнал действий** сотрудников (аудит создания/изменения/удаления).
- Разделы **Отели** и **Круизы** — заглушки «Скоро» (RateHawk и онлайн-оплата — этап 2).

## Структура кода

```
backend/
├── app/
│   ├── Models/                 # Tour, Direction, Lead, Review, Banner, Setting, SeoMeta, Category, User
│   ├── Http/
│   │   ├── Controllers/Api/        # публичный API сайта
│   │   ├── Controllers/Api/Admin/  # API админки
│   │   ├── Resources/              # форматирование ответов
│   │   ├── Requests/               # валидация
│   │   └── Middleware/SetLocale.php
│   ├── Notifications/          # уведомления о заявках
│   └── Support/AdminSerializer.php
├── database/
│   ├── migrations/             # все таблицы
│   └── seeders/                # роли, пользователи, демо-данные
├── routes/api.php              # все маршруты
├── config/cors.php
├── bootstrap/app.php           # middleware, локаль, роли
└── .env.example
```

## Установка

> Папка `backend/` содержит прикладной код. Чтобы получить полный рабочий проект,
> наложите его на свежий каркас Laravel 11 (так подтянутся стандартные конфиги, `vendor/` и `public/`).

```bash
# 1. Свежий каркас Laravel 11 рядом с проектом
composer create-project laravel/laravel:^11.0 turanasia-api
cd turanasia-api

# 2. Подключить пакеты
composer require laravel/sanctum spatie/laravel-permission spatie/laravel-translatable

# 3. Скопировать наш код поверх каркаса (из папки backend/)
cp -R ../backend/app/.                     app/
cp -R ../backend/database/migrations/.     database/migrations/
cp -R ../backend/database/seeders/.        database/seeders/
cp    ../backend/routes/api.php            routes/api.php
cp    ../backend/config/cors.php           config/cors.php
cp    ../backend/bootstrap/app.php         bootstrap/app.php
cp    ../backend/.env.example              .env

# 4. PostgreSQL: создать БД и прописать доступ в .env (DB_*)
#    createdb turanasia   (или через pgAdmin)

# 5. Ключ, символическая ссылка на хранилище (для загрузки фото), миграции с демо-данными
php artisan key:generate
php artisan storage:link
php artisan migrate --seed

# 6. Запуск
php artisan serve     # http://localhost:8000
```

> Примечание: миграции таблиц ролей и токенов уже включены в `backend/database/migrations`,
> поэтому **не** публикуйте миграции spatie/sanctum повторно (`vendor:publish ... migrations`).

## Тестовые входы (после сидера)

| Роль | E-mail | Пароль |
|------|--------|--------|
| Администратор | `admin@turan-asia.kz` | `password` |
| Контент-менеджер | `aigerim@turan-asia.kz` | `password` |

## API — основные эндпоинты

Локаль: `?lang=ru|kz|en` или заголовок `X-Locale: kz`.

### Публичные (сайт) — `/api/v1`
| Метод | Путь | Назначение |
|-------|------|-----------|
| GET | `/tours` | Каталог с фильтрами: `q, section (kazakhstan\|foreign\|baikonur), trip_type (one_day\|multi_day), country, direction_id, category_id, duration_min/max, price_min/max, date_from/to, per_page` |
| GET | `/tours/featured` | Туры на главную |
| GET | `/tours/{slug}` | Карточка тура |
| GET | `/directions?scope=domestic\|outbound` | Направления (Казахстан / за рубеж) с регионами и городами |
| GET | `/directions/{slug}` | Направление + его туры |
| GET | `/reviews` | Опубликованные отзывы |
| GET | `/banners` | Активные баннеры (с учётом периода) |
| GET | `/contacts` | Контакты, соцсети, координаты карты |
| GET | `/filters` | Опции для фильтров каталога |
| GET | `/seo/{page}` | SEO-мета страницы |
| GET | `/baikonur/launches` | Запуски Байконур (ближайшие/календарь) |
| GET | `/baikonur/launches/{slug}` | Карточка запуска (даты, места, программа, кнопка брони-заглушка) |
| GET | `/baikonur/faq` | FAQ раздела Байконур |
| GET | `/baikonur/gallery` | Галерея Байконур |
| POST | `/leads` | Отправка заявки (имя, телефон, email, tour_id, people, preferred_date, message, source) |
| POST | `/auth/login` | Вход в админку → Bearer-токен |
| GET | `/sitemap.xml`, `/robots.txt` | (web-маршруты) SEO-карта с hreflang и robots |

### Админка — `/api/v1/admin` (заголовок `Authorization: Bearer <token>`)
- `GET /stats` — дашборд
- `tours` — CRUD + `PATCH /tours/{id}/status` (published/hidden/archived)
- `directions`, `categories` — CRUD
- `leads` — список/просмотр + `PATCH /leads/{id}/status` (new/in_progress/processed/done)
- `reviews` — CRUD + `PATCH /reviews/{id}/publish`
- `banners` — CRUD + `POST /banners/reorder`
- `settings` — контакты/соцсети/карта (GET/PUT)
- `seo` — SEO по страницам (GET/PUT)
- `baikonur` — CRUD запусков; `faqs` — CRUD вопросов-ответов
- `media` — загрузка изображений (`POST /admin/media`, multipart `file`) → возвращает URL
- туры: даты выездов редактируются в форме тура (поле `dates[]`), приём заявок защищён троттлингом
- `staff` — сотрудники и роли; `audit-logs` — журнал действий (**только администратор**)

## Админ-панель (готова, подключена к API)

Файлы во фронтенд-папке проекта: `admin.html` + `assets/admin.js`.

1. Запустите бэкенд: `php artisan serve` (по умолчанию `http://localhost:8000`).
2. Откройте `admin.html` (лучше через локальный сервер, напр. `php -S localhost:5500` в папке фронта, или расширение Live Server).
3. Если API не на `http://localhost:8000/api/v1` — на экране входа нажмите «Настроить адрес сервера».
4. Войдите: `admin@turan-asia.kz` / `password` (или контент-менеджер).

Что умеет админка: дашборд со статистикой, CRUD по турам (с разделами и типами), Байконуру, направлениям, отзывам (+публикация), баннерам, FAQ; обработка заявок со сменой статуса; контакты, SEO (по языкам), сотрудники и журнал действий (только админ). Формы мультиязычные (RU/KZ/EN), авторизация по Bearer-токену.

> CORS открыт для любого источника (`config/cors.php`), т.к. админка и фронт работают по токену без cookie. Для продакшена при желании сузьте список доменов.

> Публичный сайт (фронтенд-страницы) к API пока **не** подключён — это отдельный следующий шаг.

## Этап 2 (заложено, выключено)

- **Онлайн-оплата и бронирование** туров и запусков Байконур (поля `booking_enabled`, `is_fixed_price`; провайдер эквайринга — в `.env: PAYMENT_*`). Сейчас кнопка брони — заглушка.
- Индивидуальные ссылки на оплату с изменённой стоимостью (менеджер).
- **RateHawk** — раздел «Отели» (ключи в `.env: RATEHAWK_*`). Сейчас раздел «Скоро».
- **Круизы** — наполнение позже. Сейчас раздел «Скоро».
- Telegram-уведомления о заявках (`.env: TELEGRAM_*`).

> Palm Tour из проекта исключён.

## Подключение фронтенда

Фронтенд (`index.html`, `admin.html` и финальный выбранный дизайн) подключается к API
по адресу `http://localhost:8000/api/v1`. Для админки — авторизация через `/auth/login`,
токен в заголовке `Authorization: Bearer`. CORS-домен фронта задаётся в `.env → FRONTEND_URL`.
