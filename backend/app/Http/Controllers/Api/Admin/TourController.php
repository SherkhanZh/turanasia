<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Support\AdminSerializer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TourController extends Controller
{
    public function index(Request $request)
    {
        $q = Tour::query()->with(['category', 'direction']);

        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }
        if ($request->filled('q')) {
            $q->where('title->ru', 'ilike', '%'.$request->q.'%');
        }

        $tours = $q->orderByDesc('id')->paginate((int) $request->integer('per_page', 20));

        return response()->json([
            'data' => AdminSerializer::collection($tours->items()),
            'meta' => ['total' => $tours->total(), 'page' => $tours->currentPage(), 'last_page' => $tours->lastPage()],
        ]);
    }

    public function show(Tour $tour)
    {
        $tour->load(['category', 'direction', 'dates']);

        return response()->json(AdminSerializer::make($tour));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $tour = new Tour;
        $this->fill($tour, $data);
        $tour->save();

        return response()->json(AdminSerializer::make($tour), 201);
    }

    public function update(Request $request, Tour $tour)
    {
        $data = $this->validateData($request, $tour->id);
        $this->fill($tour, $data);
        $tour->save();

        return response()->json(AdminSerializer::make($tour));
    }

    /**
     * Скрыть / опубликовать / архивировать тур.
     */
    public function setStatus(Request $request, Tour $tour)
    {
        $data = $request->validate(['status' => ['required', 'in:published,hidden,archived']]);
        $tour->update($data);

        return response()->json(['status' => $tour->status]);
    }

    public function destroy(Tour $tour)
    {
        $tour->delete();

        return response()->json(['message' => 'Тур удалён.']);
    }

    private function validateData(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'slug' => ['nullable', 'string', 'max:200'],
            'title' => ['required', 'array'],
            'title.ru' => ['required', 'string'],
            'short_description' => ['nullable', 'array'],
            'description' => ['nullable', 'array'],
            'program' => ['nullable', 'array'],
            'included' => ['nullable', 'array'],
            'extras' => ['nullable', 'array'],
            'direction_id' => ['nullable', 'exists:directions,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'section' => ['required', 'in:kazakhstan,foreign,baikonur'],
            'trip_type' => ['nullable', 'in:one_day,multi_day'],
            'price' => ['required', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'seats' => ['nullable', 'integer', 'min:0'],
            'photos' => ['nullable', 'array'],
            'status' => ['nullable', 'in:published,hidden,archived'],
            'is_fixed_price' => ['boolean'],
            'booking_enabled' => ['boolean'],
            'is_featured' => ['boolean'],
            'sort' => ['nullable', 'integer'],
        ]);
    }

    private function fill(Tour $tour, array $data): void
    {
        $translatable = ['title', 'short_description', 'description', 'program', 'included', 'extras'];

        foreach ($translatable as $field) {
            if (array_key_exists($field, $data)) {
                $tour->setTranslations($field, $data[$field] ?? []);
                unset($data[$field]);
            }
        }

        $data['slug'] = $data['slug'] ?? Str::slug(($tour->getTranslation('title', 'ru') ?: 'tour').'-'.Str::random(5));

        $tour->fill($data);
    }
}
