<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TourCardResource;
use App\Http\Resources\TourResource;
use App\Models\Tour;
use Illuminate\Http\Request;

class TourController extends Controller
{
    /**
     * Каталог туров с фильтрами: q, direction_id, country, category_id,
     * scope (domestic|outbound), duration_min/max, price_min/max, date_from/to.
     */
    public function index(Request $request)
    {
        $tours = Tour::query()
            ->published()
            ->with(['category', 'direction'])
            ->filter($request->all())
            ->orderByDesc('is_featured')
            ->orderBy('sort')
            ->paginate((int) $request->integer('per_page', 12));

        return TourCardResource::collection($tours);
    }

    public function featured()
    {
        $tours = Tour::published()->featured()->with(['category', 'direction'])
            ->orderBy('sort')->limit(8)->get();

        return TourCardResource::collection($tours);
    }

    public function show(string $slug)
    {
        $tour = Tour::published()
            ->with(['category', 'direction', 'dates'])
            ->where('slug', $slug)
            ->firstOrFail();

        return new TourResource($tour);
    }
}
