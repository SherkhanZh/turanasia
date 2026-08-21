<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BaikonurLaunch;
use App\Support\AdminSerializer;
use App\Support\Slug;
use Illuminate\Http\Request;

class BaikonurController extends Controller
{
    public function index()
    {
        return response()->json(
            AdminSerializer::collection(BaikonurLaunch::orderBy('launch_date')->get())
        );
    }

    public function show(BaikonurLaunch $launch)
    {
        return response()->json($this->serialize($launch->load('excursions')));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $launch = new BaikonurLaunch;
        $this->fill($launch, $data)->save();
        $this->syncExcursions($launch, $data['excursion_ids'] ?? null);

        return response()->json($this->serialize($launch->load('excursions')), 201);
    }

    public function update(Request $request, BaikonurLaunch $launch)
    {
        $data = $this->validateData($request);
        $this->fill($launch, $data)->save();
        $this->syncExcursions($launch, $data['excursion_ids'] ?? null);

        return response()->json($this->serialize($launch->load('excursions')));
    }

    /**
     * К обычной сериализации добавляем выбранные экскурсии,
     * чтобы форма открывалась уже с отмеченными пунктами.
     */
    private function serialize(BaikonurLaunch $launch): array
    {
        $data = AdminSerializer::make($launch);
        $data['excursion_ids'] = $launch->relationLoaded('excursions')
            ? $launch->excursions->pluck('id')->all()
            : $launch->excursions()->pluck('excursions.id')->all();

        return $data;
    }

    /**
     * Экскурсии запуска: порядок сохраняем тот, в котором их выбрали.
     */
    private function syncExcursions(BaikonurLaunch $launch, $ids): void
    {
        if ($ids === null) {
            return;
        }

        $payload = [];
        foreach (array_values(array_unique(array_map('intval', $ids))) as $i => $id) {
            $payload[$id] = ['sort' => $i];
        }

        $launch->excursions()->sync($payload);
    }

    public function destroy(BaikonurLaunch $launch)
    {
        $launch->delete();

        return response()->json(['message' => 'Запуск удалён.']);
    }

    private function validateData(Request $request): array
    {
        $rules = [
            'title' => ['required', 'array'],
            'title.ru' => ['required', 'string'],
            'title.kz' => ['nullable', 'string'],
            'title.en' => ['nullable', 'string'],
            'group_id' => ['nullable', 'exists:baikonur_groups,id'],
            'rocket' => ['nullable', 'array'],
            'description' => ['nullable', 'array'],
            'program' => ['nullable', 'array'],
            'conditions' => ['nullable', 'array'],
            'launch_date' => ['nullable', 'date'],
            'launch_time' => ['nullable'],
            'seats' => ['nullable', 'integer', 'min:0'],
            'price' => ['nullable', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'photos' => ['nullable', 'array'],
            'videos' => ['nullable', 'array'],
            'date_mode' => ['nullable', 'in:fixed,on_request'],
            'price_individual' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:scheduled,published,hidden,completed'],
            'booking_enabled' => ['boolean'],
            'sort' => ['nullable', 'integer'],
            'excursion_ids' => ['nullable', 'array'],
            'excursion_ids.*' => ['integer', 'exists:excursions,id'],
        ];

        // Каждому переводимому полю — правило на все три языка: Laravel с
        // excludeUnvalidatedArrayKeys вырезает ключи массива без правил, и
        // стоит появиться одному 'description.ru', как kz и en пропадут.
        foreach (['rocket', 'description', 'program', 'conditions'] as $key) {
            $rules[$key] = ['nullable', 'array'];
            foreach (['ru', 'kz', 'en'] as $lang) {
                $rules[$key.'.'.$lang] = ['nullable', 'string'];
            }
        }

        return $request->validate($rules);
    }

    private function fill(BaikonurLaunch $l, array $data): BaikonurLaunch
    {
        unset($data['excursion_ids']);   // сохраняются отдельной связью

        foreach (['title', 'rocket', 'description', 'program', 'conditions'] as $field) {
            if (array_key_exists($field, $data)) {
                $l->setTranslations($field, $data[$field] ?? []);
                unset($data[$field]);
            }
        }
        $l->slug = Slug::resolve($l, $data['slug'] ?? null, $l->getTranslation('title', 'ru') ?: 'launch');
        unset($data['slug']);
        $l->fill($data);

        return $l;
    }
}
