<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BaikonurLaunchResource;
use App\Models\BaikonurGroup;
use App\Models\BaikonurLaunch;
use App\Models\Faq;
use App\Models\Setting;

class BaikonurController extends Controller
{
    /**
     * Ближайшие запуски / календарь запусков.
     */
    public function launches()
    {
        return BaikonurLaunchResource::collection(BaikonurLaunch::published()->get());
    }

    public function show(string $slug)
    {
        $launch = BaikonurLaunch::published()
            ->with(['excursions' => fn ($q) => $q->where('is_active', true)])
            ->where('slug', $slug)
            ->firstOrFail();

        return new BaikonurLaunchResource($launch);
    }

    /**
     * Категории туров — кнопки-фильтры на странице.
     * Пустые категории не отдаём: кнопка, которая ничего не показывает, только мешает.
     */
    public function groups()
    {
        $groups = BaikonurGroup::active()->withCount(['launches' => fn ($q) => $q->published()])->get();

        return response()->json([
            'data' => $groups->filter(fn ($g) => $g->launches_count > 0)->map(fn ($g) => [
                'id' => $g->id,
                'slug' => $g->slug,
                'title' => $g->title,
                'count' => $g->launches_count,
            ])->values(),
        ]);
    }

    public function faq()
    {
        return response()->json(
            Faq::active()->where('group', 'baikonur')->get()->map(fn ($f) => [
                'question' => $f->question,
                'answer' => $f->answer,
            ])
        );
    }

    public function gallery()
    {
        return response()->json(Setting::get('baikonur_gallery', []));
    }

    /**
     * Снимки для блока «Космос на расстоянии вытянутой руки».
     * В верхнем баннере карусель не нужна — там одна картинка из вёрстки.
     */
    public function photos()
    {
        return response()->json(['data' => Setting::get('baikonur_hero', []) ?: []]);
    }
}
