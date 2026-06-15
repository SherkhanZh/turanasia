<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;

class Banner extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'title', 'subtitle', 'image', 'link',
        'starts_at', 'ends_at', 'is_active', 'sort',
    ];

    public array $translatable = ['title', 'subtitle'];

    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'ends_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Активные баннеры с учётом периода публикации.
     */
    public function scopeVisible($query)
    {
        $today = now()->toDateString();

        return $query->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $today))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $today))
            ->orderBy('sort');
    }
}
