<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Translatable\HasTranslations;

class AlbumItem extends Model
{
    use HasTranslations;

    protected $fillable = ['album_id', 'type', 'url', 'thumb', 'caption', 'sort'];

    public array $translatable = ['caption'];

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }
}
