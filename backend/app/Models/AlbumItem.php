<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Spatie\Translatable\HasTranslations;

class AlbumItem extends Model
{
    use HasTranslations;

    protected $fillable = ['album_id', 'code', 'type', 'url', 'thumb', 'caption', 'sort'];

    public array $translatable = ['caption'];

    protected static function booted(): void
    {
        // Каждому материалу — собственный неугадываемый адрес для отправки клиенту
        static::creating(function (AlbumItem $item) {
            if (! $item->code) {
                $item->code = static::freshCode();
            }
        });
    }

    public static function freshCode(): string
    {
        do {
            $code = Str::lower(Str::random(16));
        } while (static::where('code', $code)->exists());

        return $code;
    }

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }
}
