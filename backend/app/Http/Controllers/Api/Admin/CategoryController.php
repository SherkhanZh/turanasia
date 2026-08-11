<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\AdminSerializer;
use App\Support\Slug;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(AdminSerializer::collection(Category::orderBy('sort')->get()));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $cat = new Category;
        $cat->setTranslations('name', $data['name']);
        $cat->slug = Slug::resolve($cat, $data['slug'] ?? null, $data['name']['ru']);
        $cat->sort = $data['sort'] ?? 0;
        $cat->save();

        return response()->json(AdminSerializer::make($cat), 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $this->validateData($request);
        $category->setTranslations('name', $data['name']);
        $category->slug = Slug::resolve($category, $data['slug'] ?? null, $data['name']['ru']);
        $category->sort = $data['sort'] ?? $category->sort;
        $category->save();

        return response()->json(AdminSerializer::make($category));
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json(['message' => 'Категория удалена.']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'array'],
            'name.ru' => ['required', 'string'],
            'name.kz' => ['nullable', 'string'],
            'name.en' => ['nullable', 'string'],
            'slug' => ['nullable', 'string', 'max:120'],
            'sort' => ['nullable', 'integer'],
        ]);
    }
}
