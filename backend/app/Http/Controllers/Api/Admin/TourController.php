<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Support\AdminSerializer;
use App\Support\Slug;
use Illuminate\Http\Request;

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
        $tour->load(['category', 'direction', 'dates', 'excursions']);

        return response()->json($this->serialize($tour));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $tour = new Tour;
        $this->fill($tour, $data);
        $tour->save();
        $this->syncDates($tour, $data['dates'] ?? null);
        $this->syncExcursions($tour, $data['excursion_ids'] ?? null);

        return response()->json($this->serialize($tour->load(['dates', 'excursions'])), 201);
    }

    public function update(Request $request, Tour $tour)
    {
        $data = $this->validateData($request, $tour->id);
        $this->fill($tour, $data);
        $tour->save();
        $this->syncDates($tour, $data['dates'] ?? null);
        $this->syncExcursions($tour, $data['excursion_ids'] ?? null);

        return response()->json($this->serialize($tour->load(['dates', 'excursions'])));
    }

    /**
     * К обычной сериализации добавляем список выбранных экскурсий,
     * чтобы форма в админке открывалась уже с отмеченными пунктами.
     */
    private function serialize(Tour $tour): array
    {
        $data = AdminSerializer::make($tour);
        $data['excursion_ids'] = $tour->relationLoaded('excursions')
            ? $tour->excursions->pluck('id')->all()
            : $tour->excursions()->pluck('excursions.id')->all();

        return $data;
    }

    /**
     * Экскурсии тура: порядок сохраняем тот, в котором их выбрали.
     */
    private function syncExcursions(Tour $tour, $ids): void
    {
        if ($ids === null) {
            return;
        }

        $payload = [];
        foreach (array_values(array_unique(array_map('intval', $ids))) as $i => $id) {
            $payload[$id] = ['sort' => $i];
        }

        $tour->excursions()->sync($payload);
    }

    /**
     * Перезаписать даты выездов тура (дата/места/цена за выезд).
     */
    private function syncDates(Tour $tour, $dates): void
    {
        if ($dates === null) {
            return;
        }
        $tour->dates()->delete();
        foreach ($dates as $d) {
            if (empty($d['start_date'])) {
                continue;
            }
            $tour->dates()->create([
                'start_date' => $d['start_date'],
                'end_date' => $d['end_date'] ?? null,
                'seats' => $d['seats'] ?? null,
                'price_override' => $d['price_override'] ?? null,
            ]);
        }
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
        $rules = [
            'slug' => ['nullable', 'string', 'max:200'],
            'title' => ['required', 'array'],
            'title.ru' => ['required', 'string'],
            'title.kz' => ['nullable', 'string'],
            'title.en' => ['nullable', 'string'],
            'direction_id' => ['nullable', 'exists:directions,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'section' => ['required', 'in:kazakhstan,foreign,baikonur'],
            'trip_type' => ['nullable', 'in:one_day,multi_day'],
            'price' => ['required', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'seats' => ['nullable', 'integer', 'min:0'],
            'photos' => ['nullable', 'array'],
            'videos' => ['nullable', 'array'],
            'date_mode' => ['nullable', 'in:fixed,on_request'],
            'price_individual' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:published,hidden,archived'],
            'is_fixed_price' => ['boolean'],
            'booking_enabled' => ['boolean'],
            'is_featured' => ['boolean'],
            'sort' => ['nullable', 'integer'],
            'dates' => ['nullable', 'array'],
            'dates.*.start_date' => ['required', 'date'],
            'dates.*.end_date' => ['nullable', 'date'],
            'dates.*.seats' => ['nullable', 'integer', 'min:0'],
            'dates.*.price_override' => ['nullable', 'integer', 'min:0'],
            'excursion_ids' => ['nullable', 'array'],
            'excursion_ids.*' => ['integer', 'exists:excursions,id'],
        ];

        // Каждому переводимому полю — правило на все три языка.
        // Laravel с excludeUnvalidatedArrayKeys вырезает из массива ключи без
        // правил: стоит появиться одному 'description.ru' — и казахский с
        // английским молча пропадут при сохранении. Перечисляем языки явно.
        foreach (['short_description', 'description', 'program', 'included', 'extras'] as $key) {
            $rules[$key] = ['nullable', 'array'];
            foreach (['ru', 'kz', 'en'] as $lang) {
                $rules[$key.'.'.$lang] = ['nullable', 'string'];
            }
        }

        return $request->validate($rules);
    }

    private function fill(Tour $tour, array $data): void
    {
        unset($data['dates'], $data['excursion_ids']); // сохраняются отдельными связями

        $translatable = ['title', 'short_description', 'description', 'program', 'included', 'extras'];

        foreach ($translatable as $field) {
            if (array_key_exists($field, $data)) {
                $tour->setTranslations($field, $data[$field] ?? []);
                unset($data[$field]);
            }
        }

        $tour->slug = Slug::resolve($tour, $data['slug'] ?? null, $tour->getTranslation('title', 'ru') ?: 'tour');
        unset($data['slug']);

        $tour->fill($data);
    }
}
