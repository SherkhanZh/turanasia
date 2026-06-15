<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BaikonurLaunch;
use App\Support\AdminSerializer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
        return response()->json(AdminSerializer::make($launch));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $launch = new BaikonurLaunch;
        $this->fill($launch, $data)->save();

        return response()->json(AdminSerializer::make($launch), 201);
    }

    public function update(Request $request, BaikonurLaunch $launch)
    {
        $data = $this->validateData($request);
        $this->fill($launch, $data)->save();

        return response()->json(AdminSerializer::make($launch));
    }

    public function destroy(BaikonurLaunch $launch)
    {
        $launch->delete();

        return response()->json(['message' => 'Запуск удалён.']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'array'],
            'title.ru' => ['required', 'string'],
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
            'status' => ['nullable', 'in:scheduled,published,hidden,completed'],
            'booking_enabled' => ['boolean'],
            'sort' => ['nullable', 'integer'],
        ]);
    }

    private function fill(BaikonurLaunch $l, array $data): BaikonurLaunch
    {
        foreach (['title', 'rocket', 'description', 'program', 'conditions'] as $field) {
            if (array_key_exists($field, $data)) {
                $l->setTranslations($field, $data[$field] ?? []);
                unset($data[$field]);
            }
        }
        $data['slug'] = $data['slug'] ?? Str::slug(($l->getTranslation('title', 'ru') ?: 'launch').'-'.Str::random(4));
        $l->fill($data);

        return $l;
    }
}
