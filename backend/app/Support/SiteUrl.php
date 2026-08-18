<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Адреса публичного сайта.
 *
 * Стандартный url() строит ссылку от хоста текущего запроса. Админка живёт на
 * panel.turanasia.kz, поэтому ссылка, скопированная менеджером, указывала бы на
 * поддомен панели: клиенту такую отправлять нельзя, да и открывать публичные
 * страницы на адресе админки незачем. Здесь адрес всегда берётся из настройки
 * APP_URL.
 */
class SiteUrl
{
    public static function to(string $path = '/'): string
    {
        $base = rtrim((string) config('app.url'), '/');

        return $base.'/'.ltrim($path, '/');
    }

    /**
     * Приводит путь к полному адресу публичного сайта.
     * Внешние ссылки (например, фото на стороннем хостинге) не трогаем.
     */
    public static function absolute(?string $path, string $fallback = '/og-cover.jpg'): string
    {
        if (! $path) {
            return static::to($fallback);
        }
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        return static::to($path);
    }
}
