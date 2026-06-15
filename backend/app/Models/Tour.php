<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

class Tour extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'slug', 'section', 'trip_type', 'title', 'short_description', 'description', 'program',
        'included', 'extras', 'direction_id', 'category_id', 'price',
        'currency', 'duration_days', 'seats', 'photos', 'status', 'is_fixed_price',
        'booking_enabled', 'is_featured', 'sort', 'external_source', 'external_id',
    ];

    public array $translatable = [
        'title', 'short_description', 'description', 'program', 'included', 'extras',
    ];

    protected function casts(): array
    {
        return [
            'photos' => 'array',
            'is_fixed_price' => 'boolean',
            'booking_enabled' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function dates(): HasMany
    {
        return $this->hasMany(TourDate::class)->orderBy('start_date');
    }

    /* --- Scopes --- */

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * Фильтры каталога: по названию, направлению, длительности, цене, датам.
     */
    public function scopeFilter(Builder $query, array $f): Builder
    {
        $locale = app()->getLocale();

        if (! empty($f['q'])) {
            // поиск по названию (в текущей локали через JSON-поле)
            $query->where("title->{$locale}", 'ilike', '%'.$f['q'].'%');
        }

        // Раздел: kazakhstan|foreign|baikonur
        if (! empty($f['section'])) {
            $query->where('section', $f['section']);
        }

        // Тип тура по Казахстану: one_day|multi_day
        if (! empty($f['trip_type'])) {
            $query->where('trip_type', $f['trip_type']);
        }

        if (! empty($f['direction_id'])) {
            $query->where('direction_id', $f['direction_id']);
        }

        if (! empty($f['country'])) {
            $query->whereHas('direction', function ($q) use ($f) {
                $q->where('slug', $f['country'])->orWhere('parent_id', $f['country']);
            });
        }

        if (! empty($f['category_id'])) {
            $query->where('category_id', $f['category_id']);
        }

        if (! empty($f['scope'])) {
            $query->whereHas('direction', fn ($q) => $q->where('scope', $f['scope']));
        }

        if (isset($f['duration_min'])) {
            $query->where('duration_days', '>=', (int) $f['duration_min']);
        }
        if (isset($f['duration_max'])) {
            $query->where('duration_days', '<=', (int) $f['duration_max']);
        }

        if (isset($f['price_min'])) {
            $query->where('price', '>=', (int) $f['price_min']);
        }
        if (isset($f['price_max'])) {
            $query->where('price', '<=', (int) $f['price_max']);
        }

        if (! empty($f['date_from']) || ! empty($f['date_to'])) {
            $query->whereHas('dates', function ($q) use ($f) {
                if (! empty($f['date_from'])) {
                    $q->where('start_date', '>=', $f['date_from']);
                }
                if (! empty($f['date_to'])) {
                    $q->where('start_date', '<=', $f['date_to']);
                }
            });
        }

        return $query;
    }
}
