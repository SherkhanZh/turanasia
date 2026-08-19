<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;

class BaikonurLaunch extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'slug', 'title', 'rocket', 'description', 'program', 'conditions',
        'launch_date', 'launch_time', 'seats', 'price', 'currency',
        'photos', 'status', 'booking_enabled', 'sort',
        'date_mode', 'price_individual', 'videos', 'group_id',
    ];

    public array $translatable = ['title', 'rocket', 'description', 'program', 'conditions'];

    protected function casts(): array
    {
        return [
            'launch_date' => 'date',
            'photos' => 'array',
            'videos' => 'array',
            'booking_enabled' => 'boolean',
        ];
    }

    public function group(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(BaikonurGroup::class, 'group_id');
    }

    public function scopePublished($query)
    {
        return $query->whereIn('status', ['scheduled', 'published'])->orderBy('launch_date');
    }
}
