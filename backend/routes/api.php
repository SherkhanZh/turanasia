<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BaikonurController;
use App\Http\Controllers\Api\ContentController;
use App\Http\Controllers\Api\DirectionController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\TourController;
use App\Http\Controllers\Api\Admin;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Публичный API (сайт)
|--------------------------------------------------------------------------
| Локаль выбирается через ?lang=ru|kz|en или заголовок X-Locale.
*/
Route::prefix('v1')->group(function () {
    Route::get('tours', [TourController::class, 'index']);
    Route::get('tours/featured', [TourController::class, 'featured']);
    Route::get('tours/{slug}', [TourController::class, 'show']);

    Route::get('directions', [DirectionController::class, 'index']);
    Route::get('directions/{slug}', [DirectionController::class, 'show']);

    Route::get('reviews', [ContentController::class, 'reviews']);
    Route::get('banners', [ContentController::class, 'banners']);
    Route::get('contacts', [ContentController::class, 'contacts']);
    Route::get('filters', [ContentController::class, 'filters']);
    Route::get('seo/{page}', [ContentController::class, 'seo']);

    // Байконур (данные вводятся вручную в админке)
    Route::get('baikonur/launches', [BaikonurController::class, 'launches']);
    Route::get('baikonur/launches/{slug}', [BaikonurController::class, 'show']);
    Route::get('baikonur/faq', [BaikonurController::class, 'faq']);
    Route::get('baikonur/gallery', [BaikonurController::class, 'gallery']);

    // Приём заявки с сайта
    Route::post('leads', [LeadController::class, 'store']);

    // Авторизация в админку
    Route::post('auth/login', [AuthController::class, 'login']);
});

/*
|--------------------------------------------------------------------------
| Админ API (требует токен Sanctum + роль)
|--------------------------------------------------------------------------
*/
Route::prefix('v1/admin')
    ->middleware(['auth:sanctum', 'role:admin|content-manager'])
    ->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('stats', [Admin\StatsController::class, 'index']);

        // Туры
        Route::get('tours', [Admin\TourController::class, 'index']);
        Route::post('tours', [Admin\TourController::class, 'store']);
        Route::get('tours/{tour}', [Admin\TourController::class, 'show']);
        Route::put('tours/{tour}', [Admin\TourController::class, 'update']);
        Route::patch('tours/{tour}/status', [Admin\TourController::class, 'setStatus']);
        Route::delete('tours/{tour}', [Admin\TourController::class, 'destroy']);

        // Направления (страны/регионы/города)
        Route::get('directions', [Admin\DirectionController::class, 'index']);
        Route::post('directions', [Admin\DirectionController::class, 'store']);
        Route::put('directions/{direction}', [Admin\DirectionController::class, 'update']);
        Route::delete('directions/{direction}', [Admin\DirectionController::class, 'destroy']);

        // Категории
        Route::get('categories', [Admin\CategoryController::class, 'index']);
        Route::post('categories', [Admin\CategoryController::class, 'store']);
        Route::put('categories/{category}', [Admin\CategoryController::class, 'update']);
        Route::delete('categories/{category}', [Admin\CategoryController::class, 'destroy']);

        // Заявки
        Route::get('leads', [Admin\LeadController::class, 'index']);
        Route::get('leads/{lead}', [Admin\LeadController::class, 'show']);
        Route::patch('leads/{lead}/status', [Admin\LeadController::class, 'updateStatus']);
        Route::delete('leads/{lead}', [Admin\LeadController::class, 'destroy']);

        // Отзывы
        Route::get('reviews', [Admin\ReviewController::class, 'index']);
        Route::post('reviews', [Admin\ReviewController::class, 'store']);
        Route::put('reviews/{review}', [Admin\ReviewController::class, 'update']);
        Route::patch('reviews/{review}/publish', [Admin\ReviewController::class, 'togglePublish']);
        Route::delete('reviews/{review}', [Admin\ReviewController::class, 'destroy']);

        // Баннеры
        Route::get('banners', [Admin\BannerController::class, 'index']);
        Route::post('banners', [Admin\BannerController::class, 'store']);
        Route::put('banners/{banner}', [Admin\BannerController::class, 'update']);
        Route::post('banners/reorder', [Admin\BannerController::class, 'reorder']);
        Route::delete('banners/{banner}', [Admin\BannerController::class, 'destroy']);

        // Байконур
        Route::get('baikonur', [Admin\BaikonurController::class, 'index']);
        Route::post('baikonur', [Admin\BaikonurController::class, 'store']);
        Route::get('baikonur/{launch}', [Admin\BaikonurController::class, 'show']);
        Route::put('baikonur/{launch}', [Admin\BaikonurController::class, 'update']);
        Route::delete('baikonur/{launch}', [Admin\BaikonurController::class, 'destroy']);

        // FAQ (в т.ч. для раздела Байконур)
        Route::get('faqs', [Admin\FaqController::class, 'index']);
        Route::post('faqs', [Admin\FaqController::class, 'store']);
        Route::put('faqs/{faq}', [Admin\FaqController::class, 'update']);
        Route::delete('faqs/{faq}', [Admin\FaqController::class, 'destroy']);

        // Контакты и SEO (доступно контент-менеджеру)
        Route::get('settings', [Admin\SettingController::class, 'index']);
        Route::put('settings', [Admin\SettingController::class, 'update']);
        Route::get('seo', [Admin\SeoController::class, 'index']);
        Route::put('seo/{page}', [Admin\SeoController::class, 'update']);

        // Сотрудники, роли и журнал действий — только администратор
        Route::middleware('role:admin')->group(function () {
            Route::get('staff', [Admin\StaffController::class, 'index']);
            Route::post('staff', [Admin\StaffController::class, 'store']);
            Route::put('staff/{user}', [Admin\StaffController::class, 'update']);
            Route::get('audit-logs', [Admin\AuditLogController::class, 'index']);
        });
    });
