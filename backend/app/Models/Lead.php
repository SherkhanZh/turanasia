<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    protected $fillable = [
        'name', 'phone', 'email', 'tour_id', 'tour_title',
        'people', 'preferred_date', 'message', 'status', 'locale', 'source',
    ];

    protected function casts(): array
    {
        return [
            'preferred_date' => 'date',
        ];
    }

    public const STATUSES = ['new', 'in_progress', 'processed', 'done'];

    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }
}
