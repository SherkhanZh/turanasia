<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Переводит адреса загруженных файлов на корневые относительные пути.
 *
 * Раньше MediaController сохранял абсолютный URL вида
 * http://194.238.41.10/storage/uploads/x.jpg — после переезда на домен и HTTPS
 * такие ссылки ломаются (браузер блокирует mixed content). Относительный путь
 * /storage/uploads/x.jpg работает на любом домене и протоколе.
 */
return new class extends Migration
{
    /** json-колонки: значение приходится приводить к тексту и обратно */
    private array $jsonColumns = [
        'tours' => ['photos'],
        'directions' => ['photos'],
        'baikonur_launches' => ['photos'],
        'reviews' => ['media'],
    ];

    /** обычные строковые колонки */
    private array $textColumns = [
        'banners' => ['image'],
        'reviews' => ['avatar'],
    ];

    public function up(): void
    {
        foreach ($this->prefixes() as $prefix) {
            foreach ($this->jsonColumns as $table => $columns) {
                foreach ($columns as $col) {
                    DB::statement(
                        "UPDATE {$table} SET {$col} = REPLACE({$col}::text, ?, '/storage/')::json
                         WHERE {$col}::text LIKE ?",
                        [$prefix.'/storage/', '%'.$prefix.'/storage/%']
                    );
                }
            }
            foreach ($this->textColumns as $table => $columns) {
                foreach ($columns as $col) {
                    DB::statement(
                        "UPDATE {$table} SET {$col} = REPLACE({$col}, ?, '/storage/')
                         WHERE {$col} LIKE ?",
                        [$prefix.'/storage/', '%'.$prefix.'/storage/%']
                    );
                }
            }
        }
    }

    public function down(): void
    {
        // Обратное преобразование не требуется: относительные пути корректны везде.
    }

    /**
     * Все базовые адреса, которые могли попасть в базу.
     */
    private function prefixes(): array
    {
        $appUrl = rtrim((string) config('app.url'), '/');

        return array_values(array_unique(array_filter([
            'http://194.238.41.10',
            'https://194.238.41.10',
            'http://turanasia.kz',
            'https://turanasia.kz',
            'http://www.turanasia.kz',
            'https://www.turanasia.kz',
            $appUrl,
        ])));
    }
};
