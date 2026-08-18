<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AlbumItem;
use App\Support\MediaStore;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    /**
     * Загрузка изображения. Требует выполненного `php artisan storage:link`.
     * Фото уменьшается и получает миниатюру, см. MediaStore.
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => ['required', 'image', 'max:20480'], // до 20 МБ (уменьшим при сохранении)
        ]);

        $saved = MediaStore::image($request->file('file'));

        return response()->json([
            'path' => $saved['url'],
            'url' => $saved['url'],
            'thumb' => $saved['thumb'],
        ], 201);
    }

    /**
     * Загрузка видеофайла. Перекодирования нет, поэтому размер ограничен.
     */
    public function video(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimetypes:video/mp4,video/webm,video/quicktime', 'max:51200'], // 50 МБ
        ]);

        $saved = MediaStore::video($request->file('file'));

        return response()->json(['url' => $saved['url']], 201);
    }

    /**
     * Список ранее загруженных снимков — чтобы в турах выбирать из готового,
     * а не загружать одно и то же по второму разу.
     */
    public function library(Request $request)
    {
        $items = AlbumItem::where('type', 'image')
            ->when($request->filled('album_id'), fn ($q) => $q->where('album_id', $request->integer('album_id')))
            ->orderByDesc('id')
            ->limit(200)
            ->get(['id', 'album_id', 'url', 'thumb']);

        return response()->json(['data' => $items]);
    }
}
