<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BaikonurLaunchResource;
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
        $launch = BaikonurLaunch::published()->where('slug', $slug)->firstOrFail();

        return new BaikonurLaunchResource($launch);
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
}
