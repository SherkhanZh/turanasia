<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExcursionResource;
use App\Models\Excursion;

class ExcursionController extends Controller
{
    /**
     * Экскурсия по адресу. Отдельного каталога экскурсий на сайте нет:
     * страница открывается из программы тура или запуска.
     */
    public function show(string $slug)
    {
        $excursion = Excursion::active()
            ->with('direction')
            ->where('slug', $slug)
            ->firstOrFail();

        return new ExcursionResource($excursion);
    }
}
