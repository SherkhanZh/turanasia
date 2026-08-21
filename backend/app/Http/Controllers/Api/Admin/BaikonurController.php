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
        $this->syncExcursions($launch, $data['excursions'] ?? null);

        return response()->json($this->serialize($launch->load('excursions')), 201);
    }

    public function update(Request $request, BaikonurLaunch $launch)
    {
        $data = $this->validateData($request);
        $this->fill($launch, $data)->save();
        $this->syncExcursions($launch, $data['excursions'] ?? null);

        return response()->json($this->serialize($launch->load('excursions')));
    }

    /**
     * К обычной сериализации добавляем выбранные экскурсии,
     * чтобы форма открывалась уже с отмеченными пунктами.
     */
    private function serialize(BaikonurLaunch $launch): array
    {
        $data = AdminSerializer::make($launch);
        $data['excursions'] = $launch->excursions->map(fn ($e) => [
            'id' => $e->id,
            'day' => $e->pivot->day,
            'time' => $e->pivot->time,
        ])->values()->all();

        return $data;
    }

    /**
     * Экскурсии запуска: порядок, день и время.
     * Приходит списком [{id, day, time}] — день и время относятся к связке,
     * потому что одна экскурсия в разных поездках стоит в разные дни.
     */
    private function syncExcursions(BaikonurLaunch $launch, $rows): void
    {
        if ($rows === null) {
            return;
        }

        $payload = [];
        foreach (array_values($rows) as $i => $row) {
            $id = (int) ($row['id'] ?? 0);
            if (! $id || isset($payload[$id])) {
                continue;
            }
            $payload[$id] = [
                'sort' => $i,
                'day' => isset($row['day']) && $row['day'] !== '' ? (int) $row['day'] : null,
                'time' => $row['time'] ?? null,
            ];
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
            'excursions' => ['nullable', 'array'],
            'excursions.*.id' => ['required', 'integer', 'exists:excursions,id'],
            'excursions.*.day' => ['nullable', 'integer', 'min:1', 'max:365'],
            'excursions.*.time' => ['nullable', 'string', 'regex:/^\d{1,2}:\d{2}$/'],
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
        unset($data['excursions']);   // сохраняются отдельной связью

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
