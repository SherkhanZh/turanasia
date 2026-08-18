<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\AlbumItem;
use App\Support\AdminSerializer;
use App\Support\MediaStore;
use App\Support\Slug;
use Illuminate\Http\Request;

class AlbumController extends Controller
{
    public function index()
    {
        $albums = Album::withCount('items')->orderBy('sort')->orderByDesc('id')->get();

        return response()->json(collect($albums)->map(function ($a) {
            $row = AdminSerializer::make($a);
            $row['items_count'] = $a->items_count;
            $row['public_url'] = url('/album').'?slug='.$a->slug;

            return $row;
        })->all());
    }

    public function show(Album $album)
    {
        $row = AdminSerializer::make($album);
        $row['items'] = collect($album->items)->map(function ($i) {
            $data = AdminSerializer::make($i);
            $data['public_url'] = url('/media').'?code='.$i->code;   // ссылка на один снимок

            return $data;
        })->all();
        $row['public_url'] = url('/album').'?slug='.$album->slug;

        return response()->json($row);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $album = new Album;
        $this->fill($album, $data);
        $album->save();

        return response()->json(AdminSerializer::make($album), 201);
    }

    public function update(Request $request, Album $album)
    {
        $data = $this->validateData($request);
        $this->fill($album, $data);
        $album->save();

        return response()->json(AdminSerializer::make($album));
    }

    public function destroy(Album $album)
    {
        $album->delete();   // элементы удаляются каскадом

        return response()->json(['message' => 'Альбом удалён.']);
    }

    /* ---------- содержимое альбома ---------- */

    /**
     * Добавление элемента: либо загруженный файл, либо ссылка на ролик.
     */
    public function addItem(Request $request, Album $album)
    {
        $data = $request->validate([
            'type' => ['required', 'in:image,video'],
            'url' => ['nullable', 'string', 'max:500'],
            'file' => ['nullable', 'file', 'max:51200'],
            'caption' => ['nullable', 'array'],
        ]);

        if ($request->hasFile('file')) {
            $saved = $data['type'] === 'video'
                ? MediaStore::video($request->file('file'))
                : MediaStore::image($request->file('file'));
            $url = $saved['url'];
            $thumb = $saved['thumb'];
        } else {
            if (empty($data['url'])) {
                return response()->json(['message' => 'Нужен файл или ссылка.'], 422);
            }
            $url = $data['url'];
            $thumb = null;
        }

        $item = new AlbumItem([
            'album_id' => $album->id,
            'type' => $data['type'],
            'url' => $url,
            'thumb' => $thumb,
            'sort' => (int) $album->items()->max('sort') + 1,
        ]);
        $item->setTranslations('caption', $data['caption'] ?? []);
        $item->save();

        // Первое изображение становится обложкой, если её ещё нет
        if (! $album->cover && $data['type'] === 'image') {
            $album->cover = $thumb ?: $url;
            $album->save();
        }

        $data = AdminSerializer::make($item);
        $data['public_url'] = url('/media').'?code='.$item->code;

        return response()->json($data, 201);
    }

    public function updateItem(Request $request, Album $album, AlbumItem $item)
    {
        abort_unless($item->album_id === $album->id, 404);

        $data = $request->validate([
            'caption' => ['nullable', 'array'],
            'sort' => ['nullable', 'integer'],
        ]);

        if (array_key_exists('caption', $data)) {
            $item->setTranslations('caption', $data['caption'] ?? []);
        }
        if (isset($data['sort'])) {
            $item->sort = $data['sort'];
        }
        $item->save();

        return response()->json(AdminSerializer::make($item));
    }

    public function deleteItem(Album $album, AlbumItem $item)
    {
        abort_unless($item->album_id === $album->id, 404);
        $item->delete();

        return response()->json(['message' => 'Удалено.']);
    }

    /* ---------- вспомогательное ---------- */

    private function validateData(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'array'],
            'title.ru' => ['required', 'string'],
            'title.kz' => ['nullable', 'string'],
            'title.en' => ['nullable', 'string'],
            'description' => ['nullable', 'array'],
            'visibility' => ['required', 'in:public,unlisted'],
            'tour_id' => ['nullable', 'exists:tours,id'],
            'cover' => ['nullable', 'string', 'max:500'],
            'sort' => ['nullable', 'integer'],
        ]);
    }

    private function fill(Album $album, array $data): void
    {
        foreach (['title', 'description'] as $field) {
            if (array_key_exists($field, $data)) {
                $album->setTranslations($field, $data[$field] ?? []);
                unset($data[$field]);
            }
        }

        // Скрытый альбом получает неугадываемый адрес, публичный — читаемый
        if (! $album->exists) {
            $album->slug = $data['visibility'] === 'unlisted'
                ? Album::unlistedSlug()
                : Slug::resolve($album, null, $album->getTranslation('title', 'ru') ?: 'album');
        }
        unset($data['slug']);

        $album->fill($data);
    }
}
