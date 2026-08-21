<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Translatable\HasTranslations;

class Excursion extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'slug', 'title', 'short_description', 'description', 'program',
        'included', 'extras', 'direction_id', 'price', 'currency',
        'duration_hours', 'photos', 'videos', 'is_active', 'sort',
    ];

    public array $translatable = [
        'title', 'short_description', 'description', 'program', 'included', 'extras',
    ];

    protected function casts(): array
    {
        return [
            'photos' => 'array',
            'videos' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class);
    }

    public function tours(): BelongsToMany
    {
        return $this->belongsToMany(Tour::class)->withPivot(['sort', 'day', 'time']);
    }

    public function launches(): BelongsToMany
    {
        return $this->belongsToMany(BaikonurLaunch::class)->withPivot(['sort', 'day', 'time']);
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }
}
