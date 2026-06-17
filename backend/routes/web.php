<?php

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
