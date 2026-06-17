<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    /**
     * Загрузка изображения. Требует выполненного `php artisan storage:link`.
     * Возвращает публичный URL для сохранения в фото туров/баннеров/Байконура.
     */
    public function store(Request $request)
    {
        $request->validate([
            'file' => ['required', 'image', 'max:8192'], // до 8 МБ
        ]);

        $path = $request->file('file')->store('uploads', 'public');

        return response()->json([
            'path' => $path,
            'url' => asset('storage/'.$path),
        ], 201);
    }
}
