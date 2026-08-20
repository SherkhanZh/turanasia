<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\AdminSerializer;
use App\Support\Slug;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $q = Category::query()->orderBy('section')->orderBy('sort')->orderBy('id');

        if ($section = $request->query('section')) {
            $q->where('section', $section);
        }

        $rows = $q->withCount('tours')->get();

        return response()->json(AdminSerializer::collection($rows));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $cat = new Category;
        $this->fill($cat, $data);
        $cat->save();

        return response()->json(AdminSerializer::make($cat), 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $this->validateData($request);
        $this->fill($category, $data);
        $category->save();

        return response()->json(AdminSerializer::make($category));
    }

    public function destroy(Category $category)
    {
        // Туры остаются, просто теряют категорию.
        $category->tours()->update(['category_id' => null]);
        $category->delete();

        return response()->json(['message' => 'Категория удалена.']);
    }

    private function fill(Category $cat, array $data): void
    {
        $cat->setTranslations('name', $data['name']);

        // Пустой массив у spatie затирает все переводы, поэтому трогаем
        // описание только если оно вообще пришло в запросе.
        if (array_key_exists('description', $data)) {
            $cat->setTranslations('description', $data['description'] ?? []);
        }

        $cat->section = $data['section'];
        $cat->image = $data['image'] ?? null;
        $cat->is_active = $data['is_active'] ?? true;
        $cat->sort = $data['sort'] ?? $cat->sort ?? 0;
        // Слаг уникален внутри раздела, а не по всей таблице.
        $cat->slug = Slug::resolve($cat, $data['slug'] ?? null, $data['name']['ru'], ['section']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'section' => ['required', Rule::in(Category::sections())],
            'name' => ['required', 'array'],
            'name.ru' => ['required', 'string'],
            'name.kz' => ['nullable', 'string'],
            'name.en' => ['nullable', 'string'],
            'description' => ['nullable', 'array'],
            'description.ru' => ['nullable', 'string'],
            'description.kz' => ['nullable', 'string'],
            'description.en' => ['nullable', 'string'],
            'image' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'slug' => ['nullable', 'string', 'max:120'],
            'sort' => ['nullable', 'integer'],
        ]);
    }
}
