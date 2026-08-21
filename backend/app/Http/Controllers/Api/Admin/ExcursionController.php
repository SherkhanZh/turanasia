<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Excursion;
use App\Support\AdminSerializer;
use App\Support\Slug;
use Illuminate\Http\Request;

class ExcursionController extends Controller
{
    public function index()
    {
        $rows = Excursion::query()
            ->withCount(['tours', 'launches'])
            ->orderBy('sort')->orderBy('id')
            ->get();

        return response()->json(AdminSerializer::collection($rows));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $ex = new Excursion;
        $this->fill($ex, $data);
        $ex->save();

        return response()->json(AdminSerializer::make($ex), 201);
    }

    public function update(Request $request, Excursion $excursion)
    {
        $data = $this->validateData($request);
        $this->fill($excursion, $data);
        $excursion->save();

        return response()->json(AdminSerializer::make($excursion));
    }

    public function destroy(Excursion $excursion)
    {
        $excursion->tours()->detach();
        $excursion->launches()->detach();
        $excursion->delete();

        return response()->json(['message' => 'Экскурсия удалена.']);
    }

    private function fill(Excursion $ex, array $data): void
    {
        foreach (['title', 'short_description', 'description', 'program', 'included', 'extras'] as $key) {
            if (array_key_exists($key, $data)) {
                $ex->setTranslations($key, $data[$key] ?? []);
            }
        }

        $ex->direction_id = $data['direction_id'] ?? null;
        $ex->price = $data['price'] ?? null;
        $ex->currency = $data['currency'] ?? 'KZT';
        $ex->duration_hours = $data['duration_hours'] ?? null;
        $ex->photos = $data['photos'] ?? [];
        $ex->videos = $data['videos'] ?? [];
        $ex->is_active = $data['is_active'] ?? true;
        $ex->sort = $data['sort'] ?? $ex->sort ?? 0;
        $ex->slug = Slug::resolve($ex, $data['slug'] ?? null, $data['title']['ru']);
    }

    private function validateData(Request $request): array
    {
        $rules = [
            'title' => ['required', 'array'],
            'title.ru' => ['required', 'string'],
            'title.kz' => ['nullable', 'string'],
            'title.en' => ['nullable', 'string'],
            'direction_id' => ['nullable', 'integer', 'exists:directions,id'],
            'price' => ['nullable', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'duration_hours' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['string'],
            'videos' => ['nullable', 'array'],
            'videos.*' => ['string'],
            'is_active' => ['nullable', 'boolean'],
            'slug' => ['nullable', 'string', 'max:160'],
            'sort' => ['nullable', 'integer'],
        ];

        // Переводимые поля: под каждое — три языка, иначе Laravel вырежет
        // непровалидированные ключи массива и переводы потеряются при сохранении.
        foreach (['short_description', 'description', 'program', 'included', 'extras'] as $key) {
            $rules[$key] = ['nullable', 'array'];
            foreach (['ru', 'kz', 'en'] as $lang) {
                $rules[$key.'.'.$lang] = ['nullable', 'string'];
            }
        }

        return $request->validate($rules);
    }
}
