<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Album;

class AlbumController extends Controller
{
    /**
     * Публичная галерея: только альбомы, помеченные как видимые на сайте.
     * Подборки «только по ссылке» сюда не попадают.
     */
    public function index()
    {
        $albums = Album::public()->withCount('items')->orderBy('sort')->orderByDesc('id')->get();

        return response()->json([
            'data' => $albums->map(fn ($a) => [
                'slug' => $a->slug,
                'title' => $a->title,
                'description' => $a->description,
                'cover' => $a->cover,
                'items_count' => $a->items_count,
            ])->all(),
        ]);
    }

    /**
     * Альбом по адресу. Скрытые открываются тоже — в этом и смысл ссылки,
     * которую менеджер отправляет клиенту, но их адрес неугадываем.
     */
    public function show(string $slug)
    {
        $album = Album::with('items')->where('slug', $slug)->firstOrFail();

        return response()->json([
            'slug' => $album->slug,
            'title' => $album->title,
            'description' => $album->description,
            'visibility' => $album->visibility,
            'tour' => $album->tour ? [
                'slug' => $album->tour->slug,
                'title' => $album->tour->title,
            ] : null,
            'photos' => $album->items->where('type', 'image')->pluck('url')->values(),
            'videos' => $album->items->where('type', 'video')->pluck('url')->values(),
            'items' => $album->items->map(fn ($i) => [
                'type' => $i->type,
                'url' => $i->url,
                'thumb' => $i->thumb,
                'caption' => $i->caption,
            ])->values(),
        ]);
    }
}
