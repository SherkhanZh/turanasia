<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Translatable\HasTranslations;

class Review extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'author_name', 'country', 'avatar', 'rating', 'type', 'text', 'media',
        'video_url', 'tour_id', 'is_published', 'sort',
    ];

    public array $translatable = ['text'];

    protected function casts(): array
    {
        return [
            'media' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
