<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

class BaikonurGroup extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = ['slug', 'title', 'is_active', 'sort'];

    public array $translatable = ['title'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function launches(): HasMany
    {
        return $this->hasMany(BaikonurLaunch::class, 'group_id');
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true)->orderBy('sort')->orderBy('id');
    }
}
