<?php

namespace App\Http\Controllers;

use App\Models\Album;
use App\Models\AlbumItem;
use App\Models\BaikonurLaunch;
use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Отдаёт страницы тура и запуска с уже подставленными мета-тегами.
 *
 * WhatsApp, Telegram и соцсети не выполняют JavaScript: они читают только
 * исходный HTML. Поэтому название, описание и фото конкретного тура нужно
 * подставить на сервере — иначе в превью попадает то, что записано в файле.
 *
 * Разметка страницы содержит маркеры <!-- ta:meta --> … <!-- /ta:meta -->,
 * содержимое между ними заменяется целиком.
 */
class PageMetaController extends Controller
{
    private const LANGS = ['ru', 'kz', 'en'];

    public function tour(Request $request)
    {
        $lang = $this->lang($request);
        $tour = Tour::published()->where('slug', $request->query('slug'))->first();

        if (! $tour) {
            return $this->render('tour.html', null);
        }

        return $this->render('tour.html', [
            'title' => $tour->getTranslation('title', $lang, true),
            'description' => $tour->getTranslation('short_description', $lang, true)
                ?: $tour->getTranslation('description', $lang, true),
            'image' => $tour->photos[0] ?? null,
            'url' => url('/tour').'?slug='.$tour->slug.($lang === 'ru' ? '' : '&lang='.$lang),
            'lang' => $lang,
        ]);
    }

    /**
     * Страница альбома. Скрытые альбомы дополнительно закрываются от индексации:
     * ссылка предназначена конкретному клиенту, в поиске ей делать нечего.
     */
    public function album(Request $request)
    {
        $lang = $this->lang($request);
        $album = Album::with('items')->where('slug', $request->query('slug'))->first();

        if (! $album) {
            return $this->render('album.html', null);
        }

        $cover = $album->cover ?: optional($album->items->firstWhere('type', 'image'))->url;

        return $this->render('album.html', [
            'title' => $album->getTranslation('title', $lang, true),
            'description' => $album->getTranslation('description', $lang, true),
            'image' => $cover,
            'url' => url('/album').'?slug='.$album->slug.($lang === 'ru' ? '' : '&lang='.$lang),
            'lang' => $lang,
            'noindex' => $album->isUnlisted(),
        ]);
    }

    /**
     * Отдельный снимок или ролик. В превью мессенджера должна попасть именно
     * эта картинка с её подписью, а не обложка альбома.
     */
    public function media(Request $request)
    {
        $lang = $this->lang($request);
        $item = AlbumItem::with('album')->where('code', $request->query('code'))->first();

        if (! $item) {
            return $this->render('media.html', null);
        }

        $caption = $item->getTranslation('caption', $lang, true);
        $albumTitle = $item->album ? $item->album->getTranslation('title', $lang, true) : 'Turan Asia';

        return $this->render('media.html', [
            'title' => $caption ?: $albumTitle,
            'description' => $caption ?: $albumTitle,
            'image' => $item->type === 'image' ? $item->url : ($item->thumb ?: optional($item->album)->cover),
            'url' => url('/media').'?code='.$item->code.($lang === 'ru' ? '' : '&lang='.$lang),
            'lang' => $lang,
            'noindex' => ! $item->album || $item->album->isUnlisted(),
        ]);
    }

    public function launch(Request $request)
    {
        $lang = $this->lang($request);
        $l = BaikonurLaunch::where('slug', $request->query('slug'))->first();

        if (! $l) {
            return $this->render('launch.html', null);
        }

        return $this->render('launch.html', [
            'title' => $l->getTranslation('title', $lang, true),
            'description' => $l->getTranslation('description', $lang, true),
            'image' => $l->photos[0] ?? null,
            'url' => url('/launch').'?slug='.$l->slug.($lang === 'ru' ? '' : '&lang='.$lang),
            'lang' => $lang,
        ]);
    }

    private function lang(Request $request): string
    {
        $l = (string) $request->query('lang', 'ru');

        return in_array($l, self::LANGS, true) ? $l : 'ru';
    }

    /**
     * @param  array<string,mixed>|null  $meta  null — отдать файл без изменений
     */
    private function render(string $file, ?array $meta)
    {
        $path = public_path($file);
        if (! is_file($path)) {
            abort(404);
        }

        $html = file_get_contents($path);

        if ($meta !== null) {
            $html = $this->injectTitle($html, $meta['title']);
            $html = $this->injectBlock($html, $this->buildTags($meta));
        }

        return response($html)->header('Content-Type', 'text/html; charset=utf-8');
    }

    private function injectTitle(string $html, string $title): string
    {
        return preg_replace(
            '#<title>.*?</title>#s',
            '<title>'.e($title).' — Turan Asia</title>',
            $html,
            1
        );
    }

    private function injectBlock(string $html, string $tags): string
    {
        $replaced = preg_replace(
            '#<!-- ta:meta -->.*?<!-- /ta:meta -->#s',
            "<!-- ta:meta -->\n".$tags."\n<!-- /ta:meta -->",
            $html,
            1
        );

        return $replaced ?? $html;
    }

    /**
     * @param  array<string,mixed>  $m
     */
    private function buildTags(array $m): string
    {
        $title = $m['title'].' — Turan Asia';
        $desc = Str::limit(trim(preg_replace('/\s+/u', ' ', strip_tags((string) $m['description']))), 200);
        $image = $this->absolute($m['image']);
        $locale = ['ru' => 'ru_RU', 'kz' => 'kk_KZ', 'en' => 'en_US'][$m['lang']];

        $tags = [];
        if (! empty($m['noindex'])) {
            $tags[] = '<meta name="robots" content="noindex, nofollow">';
        }
        $tags = array_merge($tags, [
            '<meta name="description" content="'.e($desc).'">',
            '<link rel="canonical" href="'.e($m['url']).'">',
            '<meta property="og:type" content="article">',
            '<meta property="og:site_name" content="Turan Asia">',
            '<meta property="og:locale" content="'.$locale.'">',
            '<meta property="og:title" content="'.e($title).'">',
            '<meta property="og:description" content="'.e($desc).'">',
            '<meta property="og:url" content="'.e($m['url']).'">',
            '<meta property="og:image" content="'.e($image).'">',
            '<meta name="twitter:card" content="summary_large_image">',
        ]);

        return implode("\n", $tags);
    }

    /**
     * Фото тура может быть относительным путём — превью требует полный адрес.
     */
    private function absolute(?string $path): string
    {
        if (! $path) {
            return url('/og-cover.jpg');
        }
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        return url('/'.ltrim($path, '/'));
    }
}
