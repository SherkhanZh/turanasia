<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\Translatable\HasTranslations;

class Album extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'slug', 'title', 'description', 'cover', 'visibility', 'tour_id', 'sort',
    ];

    public array $translatable = ['title', 'description'];

    public function items(): HasMany
    {
        return $this->hasMany(AlbumItem::class)->orderBy('sort')->orderBy('id');
    }

    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }

    /** Альбомы, которые видны в публичной галерее. */
    public function scopePublic(Builder $q): Builder
    {
        return $q->where('visibility', 'public');
    }

    public function isUnlisted(): bool
    {
        return $this->visibility === 'unlisted';
    }

    /**
     * Для скрытых альбомов адрес должен быть неугадываемым, иначе подборку,
     * отправленную одному клиенту, найдёт любой желающий перебором.
     */
    public static function unlistedSlug(): string
    {
        do {
            $slug = Str::lower(Str::random(24));
        } while (static::where('slug', $slug)->exists());

        return $slug;
    }
}
