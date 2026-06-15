<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;

class SeoMeta extends Model
{
    use HasTranslations;

    protected $table = 'seo_metas';

    protected $fillable = ['page', 'title', 'description', 'keywords', 'og_image'];

    public array $translatable = ['title', 'description', 'keywords'];
}
