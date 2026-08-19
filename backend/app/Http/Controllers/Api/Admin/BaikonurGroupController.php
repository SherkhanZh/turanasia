<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BaikonurGroup;
use App\Support\AdminSerializer;
use App\Support\Slug;
use Illuminate\Http\Request;

class BaikonurGroupController extends Controller
{
    public function index()
    {
        $groups = BaikonurGroup::withCount('launches')->orderBy('sort')->orderBy('id')->get();

        return response()->json(collect($groups)->map(function ($g) {
            $row = AdminSerializer::make($g);
            $row['launches_count'] = $g->launches_count;

            return $row;
        })->all());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $group = new BaikonurGroup;
        $this->fill($group, $data);
        $group->save();

        return response()->json(AdminSerializer::make($group), 201);
    }

    public function update(Request $request, BaikonurGroup $group)
    {
        $data = $this->validateData($request);
        $this->fill($group, $data);
        $group->save();

        return response()->json(AdminSerializer::make($group));
    }

    public function destroy(BaikonurGroup $group)
    {
        // Туры не удаляем — они просто перестают относиться к категории
        $group->delete();

        return response()->json(['message' => 'Категория удалена.']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'array'],
            'title.ru' => ['required', 'string'],
            'title.kz' => ['nullable', 'string'],
            'title.en' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'sort' => ['nullable', 'integer'],
        ]);
    }

    private function fill(BaikonurGroup $group, array $data): void
    {
        if (array_key_exists('title', $data)) {
            $group->setTranslations('title', $data['title'] ?? []);
            unset($data['title']);
        }

        $group->slug = Slug::resolve($group, null, $group->getTranslation('title', 'ru') ?: 'group');
        $group->fill($data);
    }
}
