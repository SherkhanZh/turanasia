<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public static function get(string $key, $default = null)
    {
        $row = static::where('key', $key)->first();

        return $row ? $row->value : $default;
    }

    public static function put(string $key, $value, string $group = 'general'): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value, 'group' => $group]);
        Cache::forget('settings.all');
    }

    /**
     * Все настройки картой «ключ → значение».
     *
     * Раньше метод назывался all() и перекрывал одноимённый метод Eloquent:
     * вызов Setting::all()->get() падал с фатальной ошибкой, потому что у
     * коллекции get() требует аргумент. Отдельное имя убирает эту ловушку.
     */
    public static function map()
    {
        return Cache::rememberForever('settings.all', function () {
            return static::query()->get()->mapWithKeys(fn ($s) => [$s->key => $s->value]);
        });
    }
}
