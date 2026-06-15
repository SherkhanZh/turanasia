<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

class Category extends Model
{
    use HasTranslations;

    protected $fillable = ['slug', 'name', 'sort'];

    public array $translatable = ['name'];

    public function tours(): HasMany
    {
        return $this->hasMany(Tour::class);
    }
}
