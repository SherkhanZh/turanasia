<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

class Category extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'slug', 'section', 'name', 'description', 'image', 'is_active', 'sort',
    ];

    public array $translatable = ['name', 'description'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function tours(): HasMany
    {
        return $this->hasMany(Tour::class);
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }

    /**
     * Разделы, к которым может относиться категория.
     * Совпадают с разделами каталога на сайте.
     */
    public static function sections(): array
    {
        return ['kazakhstan', 'foreign', 'hotels', 'cruises'];
    }
}
