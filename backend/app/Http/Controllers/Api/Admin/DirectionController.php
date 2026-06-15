<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Direction;
use App\Support\AdminSerializer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DirectionController extends Controller
{
    public function index()
    {
        // Дерево: страны → регионы → города
        $tree = Direction::with('children.children')->countries()->orderBy('sort')->get();

        return response()->json($this->serializeTree($tree));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $direction = new Direction;
        $this->fill($direction, $data);
        $direction->save();

        return response()->json(AdminSerializer::make($direction), 201);
    }

    public function update(Request $request, Direction $direction)
    {
        $data = $this->validateData($request, $direction->id);
        $this->fill($direction, $data);
        $direction->save();

        return response()->json(AdminSerializer::make($direction));
    }

    public function destroy(Direction $direction)
    {
        $direction->delete();

        return response()->json(['message' => 'Направление удалено.']);
    }

    private function serializeTree($items)
    {
        return collect($items)->map(function ($d) {
            $row = AdminSerializer::make($d);
            $row['children'] = $this->serializeTree($d->children);

            return $row;
        })->all();
    }

    private function validateData(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'parent_id' => ['nullable', 'exists:directions,id'],
            'type' => ['required', 'in:country,region,city'],
            'scope' => ['nullable', 'in:domestic,outbound'],
            'slug' => ['nullable', 'string', 'max:200'],
            'name' => ['required', 'array'],
            'name.ru' => ['required', 'string'],
            'description' => ['nullable', 'array'],
            'info' => ['nullable', 'array'],
            'photos' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'sort' => ['nullable', 'integer'],
        ]);
    }

    private function fill(Direction $d, array $data): void
    {
        foreach (['name', 'description', 'info'] as $field) {
            if (array_key_exists($field, $data)) {
                $d->setTranslations($field, $data[$field] ?? []);
                unset($data[$field]);
            }
        }
        $data['slug'] = $data['slug'] ?? Str::slug(($d->getTranslation('name', 'ru') ?: 'dir').'-'.Str::random(4));
        $d->fill($data);
    }
}
