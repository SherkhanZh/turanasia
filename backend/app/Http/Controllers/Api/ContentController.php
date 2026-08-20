<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BannerResource;
use App\Http\Resources\ReviewResource;
use App\Http\Resources\TourCardResource;
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
     * Категории раздела: кнопки-фильтры на странице каталога.
     * Отдаём только те, в которых есть опубликованные туры.
     */
    public function categories(Request $request)
    {
        $section = $request->query('section', 'kazakhstan');
        if (! is_string($section) || ! in_array($section, Category::sections(), true)) {
            $section = 'kazakhstan';
        }

        $rows = Category::active()
            ->where('section', $section)
            // Считаем только туры того же раздела: тур мог сменить раздел,
            // а категория осталась прежней.
            ->withCount(['tours' => fn ($q) => $q->where('status', 'published')->where('section', $section)])
            ->orderBy('sort')->orderBy('id')
            ->get()
            ->filter(fn ($c) => $c->tours_count > 0)
            ->map(fn ($c) => [
                'id' => $c->id,
                'slug' => $c->slug,
                'name' => $c->name,
                'description' => $c->description,
                'image' => $c->image,
                'tours_count' => $c->tours_count,
            ])->values();

        return response()->json(['data' => $rows]);
    }

    /**
     * Блоки главной страницы, которые редактируются в админке:
     * карусель в шапке, плитки «Куда отправимся», подборка популярных туров.
     * Пустое значение означает «оставить то, что зашито в вёрстке».
     */
    public function home()
    {
        $ids = Setting::get('home_popular', []) ?: [];

        if ($ids) {
            $found = Tour::published()->with(['category', 'direction'])
                ->whereIn('id', $ids)->get()->keyBy('id');
            // Порядок — как выставлен в админке, а не как вернула база.
            $tours = collect($ids)->map(fn ($id) => $found->get($id))->filter()->values();
        } else {
            // Подборка не задана — показываем туры с галочкой «На главной».
            $tours = Tour::published()->featured()->with(['category', 'direction'])
                ->orderBy('sort')->limit(6)->get();
        }

        return response()->json([
            'slider' => Setting::get('home_slider', []) ?: [],
            'destinations' => Setting::get('home_destinations', []) ?: [],
            'popular' => TourCardResource::collection($tours)->toArray(request()),
        ]);
    }

    /**
     * Опции для фильтров каталога.
     */
    public function filters(Request $request)
    {
        return response()->json([
            'categories' => Category::active()
                ->when(
                    in_array($request->query('section'), Category::sections(), true),
                    fn ($q) => $q->where('section', $request->query('section'))
                )
                ->orderBy('sort')->get()->map(fn ($c) => [
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
