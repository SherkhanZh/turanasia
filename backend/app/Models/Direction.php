<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

class Direction extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'parent_id', 'type', 'scope', 'slug',
        'name', 'description', 'info', 'photos', 'is_active', 'sort',
    ];

    public array $translatable = ['name', 'description', 'info'];

    protected function casts(): array
    {
        return [
            'photos' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Direction::class, 'parent_id')->orderBy('sort');
    }

    public function tours(): HasMany
    {
        return $this->hasMany(Tour::class);
    }

    public function scopeCountries($query)
    {
        return $query->where('type', 'country');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
