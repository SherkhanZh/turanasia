<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $supported = explode(',', env('SUPPORTED_LOCALES', 'ru,kz,en'));

        $locale = $request->query('lang')
            ?? $request->header('X-Locale')
            ?? $request->getPreferredLanguage($supported)
            ?? config('app.locale');

        if (in_array($locale, $supported, true)) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
