<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Повторный проход по адресам загруженных файлов — теперь через разбор JSON.
 *
 * Предыдущая миграция делала REPLACE по тексту json-колонки и не срабатывала:
 * PostgreSQL хранит значение ровно так, как его записал json_encode, то есть
 * со экранированными слэшами (http:\/\/194.238.41.10\/storage\/...), поэтому
 * поиск подстроки с обычными слэшами ничего не находил.
 *
 * Здесь значение декодируется, каждый адрес приводится к виду /storage/...,
 * и строка кодируется обратно. Внешние ссылки (unsplash и т.п.) не трогаем.
 */
return new class extends Migration
{
    /** [таблица, колонка] с массивом адресов */
    private array $jsonColumns = [
        ['tours', 'photos'],
        ['directions', 'photos'],
        ['baikonur_launches', 'photos'],
        ['reviews', 'media'],
    ];

    /** [таблица, колонка] с одиночным адресом */
    private array $textColumns = [
        ['banners', 'image'],
        ['reviews', 'avatar'],
    ];

    public function up(): void
    {
        foreach ($this->jsonColumns as [$table, $col]) {
            $this->eachRow($table, $col, function ($value) {
                $list = json_decode((string) $value, true);
                if (! is_array($list)) {
                    return null;
                }
                $fixed = array_map(fn ($u) => $this->relative($u), $list);

                return $fixed === $list ? null : json_encode($fixed);
            });
        }

        foreach ($this->textColumns as [$table, $col]) {
            $this->eachRow($table, $col, function ($value) {
                $fixed = $this->relative((string) $value);

                return $fixed === $value ? null : $fixed;
            });
        }
    }

    public function down(): void
    {
        // Относительные пути корректны на любом домене — откат не нужен.
    }

    /**
     * Обходит строки таблицы и применяет $transform; null означает «менять нечего».
     */
    private function eachRow(string $table, string $col, callable $transform): void
    {
        if (! DB::getSchemaBuilder()->hasTable($table)) {
            return;
        }

        DB::table($table)->select('id', $col)->orderBy('id')->chunk(200, function ($rows) use ($table, $col, $transform) {
            foreach ($rows as $row) {
                $value = $row->{$col};
                if ($value === null || $value === '') {
                    continue;
                }
                $new = $transform($value);
                if ($new !== null) {
                    DB::table($table)->where('id', $row->id)->update([$col => $new]);
                }
            }
        });
    }

    /**
     * https://любой-хост/storage/... → /storage/...
     * Внешние адреса без /storage/ остаются как есть.
     */
    private function relative(mixed $url): mixed
    {
        if (! is_string($url)) {
            return $url;
        }

        return preg_replace('#^https?://[^/]+(/storage/)#i', '$1', $url);
    }
};
