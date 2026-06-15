<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Support\AdminSerializer;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    public function index()
    {
        return response()->json(
            AdminSerializer::collection(Banner::orderBy('sort')->get())
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $banner = new Banner;
        $this->fill($banner, $data)->save();

        return response()->json(AdminSerializer::make($banner), 201);
    }

    public function update(Request $request, Banner $banner)
    {
        $data = $this->validateData($request);
        $this->fill($banner, $data)->save();

        return response()->json(AdminSerializer::make($banner));
    }

    /**
     * Изменение порядка отображения баннеров.
     */
    public function reorder(Request $request)
    {
        $data = $request->validate(['order' => ['required', 'array'], 'order.*' => ['integer']]);
        foreach ($data['order'] as $sort => $id) {
            Banner::where('id', $id)->update(['sort' => $sort]);
        }

        return response()->json(['message' => 'Порядок обновлён.']);
    }

    public function destroy(Banner $banner)
    {
        $banner->delete();

        return response()->json(['message' => 'Баннер удалён.']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'array'],
            'title.ru' => ['required', 'string'],
            'subtitle' => ['nullable', 'array'],
            'image' => ['required', 'string', 'max:255'],
            'link' => ['nullable', 'string', 'max:255'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
            'sort' => ['nullable', 'integer'],
        ]);
    }

    private function fill(Banner $b, array $data): Banner
    {
        foreach (['title', 'subtitle'] as $field) {
            if (array_key_exists($field, $data)) {
                $b->setTranslations($field, $data[$field] ?? []);
                unset($data[$field]);
            }
        }
        $b->fill($data);

        return $b;
    }
}
