<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Генерация ЧПУ-адресов.
 *
 * Главное правило: слаг задаётся один раз при создании записи и больше не
 * меняется сам по себе. Иначе каждое сохранение в админке выдавало бы новый
 * адрес и все ранее выданные ссылки на тур переставали работать (404).
 */
class Slug
{
    public static function resolve(Model $model, ?string $requested, string $base): string
    {
        // Слаг, введённый вручную в админке, имеет приоритет.
        if (filled($requested)) {
            return static::unique($model, Str::slug($requested));
        }

        // У уже существующей записи слаг не трогаем.
        if (filled($model->slug)) {
            return $model->slug;
        }

        return static::unique($model, Str::slug($base) ?: 'item');
    }

    /**
     * Добавляет -2, -3, … если слаг уже занят другой записью.
     */
    private static function unique(Model $model, string $slug): string
    {
        $base = $slug ?: 'item';
        $slug = $base;
        $i = 2;

        while (
            $model->newQuery()
                ->where('slug', $slug)
                ->when($model->exists, fn ($q) => $q->whereKeyNot($model->getKey()))
                ->exists()
        ) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
