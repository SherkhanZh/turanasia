<?php

use App\Http\Controllers\PageMetaController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => config('app.name'),
        'status' => 'ok',
        'api' => url('/api'),
    ]);
});

// SEO
Route::get('/sitemap.xml', [SitemapController::class, 'sitemap']);
Route::get('/robots.txt', [SitemapController::class, 'robots']);

// Страницы тура и запуска отдаём через PHP, чтобы подставить мета-теги:
// мессенджеры и соцсети читают только исходный HTML, без JavaScript.
Route::get('/tour', [PageMetaController::class, 'tour']);
Route::get('/launch', [PageMetaController::class, 'launch']);
Route::get('/excursion', [PageMetaController::class, 'excursion']);
Route::get('/album', [PageMetaController::class, 'album']);
Route::get('/media', [PageMetaController::class, 'media']);
