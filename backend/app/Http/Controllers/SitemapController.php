<?php

namespace App\Http\Controllers;

use App\Models\BaikonurLaunch;
use App\Models\Excursion;
use App\Models\Tour;

class SitemapController extends Controller
{
    private array $locales = ['ru', 'kz', 'en'];

    private function front(): string
    {
        return rtrim(env('FRONTEND_URL', config('app.url')), '/');
    }

    /**
     * sitemap.xml с hreflang-альтернативами для трёх языков.
     */
    public function sitemap()
    {
        $front = $this->front();

        $paths = ['/', '/tours', '/foreign', '/baikonur', '/individual', '/about', '/reviews', '/contacts'];

        // Карточки открываются по слагу в параметре: /tour?slug=…, а не /tours/…
        // Раньше здесь были адреса, которых на сайте не существует.
        foreach (Tour::published()->pluck('slug') as $slug) {
            $paths[] = '/tour?slug='.$slug;
        }
        foreach (BaikonurLaunch::published()->pluck('slug') as $slug) {
            $paths[] = '/launch?slug='.$slug;
        }
        foreach (Excursion::active()->pluck('slug') as $slug) {
            $paths[] = '/excursion?slug='.$slug;
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'."\n";

        foreach ($paths as $p) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>'.htmlspecialchars($front.$p).'</loc>'."\n";
            foreach ($this->locales as $loc) {
                $href = $front.$p.(str_contains($p, '?') ? '&' : '?').'lang='.$loc;
                $xml .= '    <xhtml:link rel="alternate" hreflang="'.$loc.'" href="'.htmlspecialchars($href).'"/>'."\n";
            }
            $xml .= '    <xhtml:link rel="alternate" hreflang="x-default" href="'.htmlspecialchars($front.$p).'"/>'."\n";
            $xml .= "  </url>\n";
        }
        $xml .= '</urlset>';

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }

    public function robots()
    {
        $txt = "User-agent: *\nAllow: /\n\nSitemap: ".$this->front()."/sitemap.xml\n";

        return response($txt, 200, ['Content-Type' => 'text/plain']);
    }
}
