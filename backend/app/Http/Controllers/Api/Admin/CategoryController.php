<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\AdminSerializer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
        $cat->slug = $data['slug'] ?? Str::slug($data['name']['ru']);
        $cat->sort = $data['sort'] ?? 0;
        $cat->save();

        return response()->json(AdminSerializer::make($cat), 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $this->validateData($request);
        $category->setTranslations('name', $data['name']);
        if (! empty($data['slug'])) {
            $category->slug = $data['slug'];
        }
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
            'slug' => ['nullable', 'string', 'max:120'],
            'sort' => ['nullable', 'integer'],
        ]);
    }
}
