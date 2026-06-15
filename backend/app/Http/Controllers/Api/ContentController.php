<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BannerResource;
use App\Http\Resources\ReviewResource;
use App\Models\Banner;
use App\Models\Category;
use App\Models\Review;
use App\Models\SeoMeta;
use App\Models\Setting;
use App\Models\Tour;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function reviews()
    {
        return ReviewResource::collection(
            Review::published()->with('tour')->orderBy('sort')->latest()->get()
        );
    }

    public function banners()
    {
        return BannerResource::collection(Banner::visible()->get());
    }

    public function contacts()
    {
        // Публичные настройки: контакты, соцсети, карта.
        return response()->json(
            Setting::query()->whereIn('group', ['contacts', 'socials', 'map'])
                ->get()->mapWithKeys(fn ($s) => [$s->key => $s->value])
        );
    }

    public function seo(string $page)
    {
        $meta = SeoMeta::where('page', $page)->first();

        return response()->json($meta ? [
            'page' => $meta->page,
            'title' => $meta->title,
            'description' => $meta->description,
            'keywords' => $meta->keywords,
            'og_image' => $meta->og_image,
        ] : null);
    }

    /**
     * Опции для фильтров каталога.
     */
    public function filters(Request $request)
    {
        return response()->json([
            'categories' => Category::orderBy('sort')->get()->map(fn ($c) => [
                'id' => $c->id, 'slug' => $c->slug, 'name' => $c->name,
            ]),
            'countries' => \App\Models\Direction::active()->countries()->orderBy('sort')->get()
                ->map(fn ($d) => ['id' => $d->id, 'slug' => $d->slug, 'name' => $d->name, 'scope' => $d->scope]),
            'price' => [
                'min' => (int) Tour::published()->min('price'),
                'max' => (int) Tour::published()->max('price'),
            ],
            'duration' => [
                'min' => (int) Tour::published()->min('duration_days'),
                'max' => (int) Tour::published()->max('duration_days'),
            ],
        ]);
    }
}
