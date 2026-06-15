<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DirectionResource;
use App\Http\Resources\TourCardResource;
use App\Models\Direction;
use Illuminate\Http\Request;

class DirectionController extends Controller
{
    /**
     * Страны с вложенными регионами/городами.
     * ?scope=domestic|outbound — туры по Казахстану / за рубеж.
     */
    public function index(Request $request)
    {
        $countries = Direction::query()
            ->active()
            ->countries()
            ->when($request->filled('scope'), fn ($q) => $q->where('scope', $request->scope))
            ->withCount('tours')
            ->with('children')
            ->orderBy('sort')
            ->get();

        return DirectionResource::collection($countries);
    }

    public function show(string $slug)
    {
        $direction = Direction::active()->with('children')->where('slug', $slug)->firstOrFail();

        $tours = $direction->tours()->published()->with(['category', 'direction'])->orderBy('sort')->get();

        return (new DirectionResource($direction))->additional([
            'tours' => TourCardResource::collection($tours),
        ]);
    }
}
