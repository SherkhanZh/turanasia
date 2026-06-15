<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;

class AdminSerializer
{
    /**
     * Сериализует модель для админки, разворачивая все переводы (RU/KZ/EN),
     * а не только текущую локаль.
     */
    public static function make(Model $model): array
    {
        $data = $model->toArray();

        if (property_exists($model, 'translatable')) {
            foreach ($model->translatable as $field) {
                $data[$field] = $model->getTranslations($field);
            }
        }

        return $data;
    }

    public static function collection($models): array
    {
        return collect($models)->map(fn ($m) => static::make($m))->all();
    }
}
