<?php

return [
    // Все маршруты API
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    /*
     | Админ-панель и фронтенд обращаются к API по Bearer-токену (Sanctum),
     | без cookie-сессии, поэтому разрешаем любой источник и НЕ используем
     | credentials. Для продакшена при желании сузьте список доменов.
     */
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
