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

    /**
     * Направление вместе со всем, что под ним: страна → регионы → города.
     *
     * Нужно для фильтра каталога. Тур привязан к одной точке дерева, поэтому
     * без этого выбор «Казахстан» не находил бы тур с направлением «Мангистау».
     * Справочник маленький, поэтому обходим его целиком в памяти.
     */
    public static function withDescendants(int $id): array
    {
        // Приводим к int явно: PDO у PostgreSQL отдаёт bigint строкой,
        // и строгое сравнение молча перестало бы находить потомков.
        $pairs = [];
        foreach (static::query()->pluck('parent_id', 'id') as $child => $parent) {
            $pairs[(int) $child] = $parent === null ? null : (int) $parent;
        }

        $ids = [$id];
        $frontier = [$id];

        while ($frontier) {
            $next = [];
            foreach ($pairs as $child => $parent) {
                if ($parent !== null && in_array($parent, $frontier, true) && ! in_array($child, $ids, true)) {
                    $ids[] = $child;
                    $next[] = $child;
                }
            }
            $frontier = $next;
        }

        return $ids;
    }
}
