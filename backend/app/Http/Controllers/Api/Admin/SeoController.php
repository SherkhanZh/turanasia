<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoMeta;
use App\Support\AdminSerializer;
use Illuminate\Http\Request;

class SeoController extends Controller
{
    public function index()
    {
        return response()->json(AdminSerializer::collection(SeoMeta::orderBy('page')->get()));
    }

    public function update(Request $request, string $page)
    {
        $data = $request->validate([
            'title' => ['nullable', 'array'],
            'description' => ['nullable', 'array'],
            'keywords' => ['nullable', 'array'],
            'og_image' => ['nullable', 'string', 'max:255'],
        ]);

        $meta = SeoMeta::firstOrNew(['page' => $page]);
        foreach (['title', 'description', 'keywords'] as $f) {
            if (array_key_exists($f, $data)) {
                $meta->setTranslations($f, $data[$f] ?? []);
            }
        }
        if (array_key_exists('og_image', $data)) {
            $meta->og_image = $data['og_image'];
        }
        $meta->save();

        return response()->json(AdminSerializer::make($meta));
    }
}
