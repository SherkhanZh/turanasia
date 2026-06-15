<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;

class Faq extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = ['group', 'question', 'answer', 'is_active', 'sort'];

    public array $translatable = ['question', 'answer'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort');
    }
}
