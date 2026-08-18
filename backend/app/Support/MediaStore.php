<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Сохранение загруженных файлов.
 *
 * Снимки с телефона весят по 5–10 МБ и в исходном размере отдавать их
 * посетителю бессмысленно: страница будет грузиться минутами, а диск сервера
 * быстро закончится. Поэтому фото уменьшается до разумного размера, и рядом
 * кладётся миниатюра для сеток и списков.
 *
 * Если расширение GD в PHP недоступно, файл сохраняется как есть — лучше так,
 * чем уронить загрузку.
 */
class MediaStore
{
    private const MAX_SIDE = 2000;   // большая сторона полноразмерной версии
    private const THUMB_SIDE = 600;  // большая сторона миниатюры
    private const QUALITY = 82;

    /**
     * @return array{url:string,thumb:?string}
     */
    public static function image(UploadedFile $file): array
    {
        $dir = 'uploads/'.date('Y/m');
        $name = Str::random(32);
        $ext = Str::lower($file->getClientOriginalExtension() ?: 'jpg');

        if (! extension_loaded('gd') || ! in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $path = $file->store($dir, 'public');

            return ['url' => '/storage/'.$path, 'thumb' => null];
        }

        $src = static::read($file->getRealPath(), $ext);
        if (! $src) {
            $path = $file->store($dir, 'public');

            return ['url' => '/storage/'.$path, 'thumb' => null];
        }

        $src = static::fixOrientation($src, $file->getRealPath(), $ext);

        $full = static::resize($src, self::MAX_SIDE);
        $thumb = static::resize($src, self::THUMB_SIDE);
        imagedestroy($src);

        $fullPath = $dir.'/'.$name.'.jpg';
        $thumbPath = $dir.'/'.$name.'_thumb.jpg';

        Storage::disk('public')->put($fullPath, static::encode($full));
        Storage::disk('public')->put($thumbPath, static::encode($thumb));

        imagedestroy($full);
        imagedestroy($thumb);

        return ['url' => '/storage/'.$fullPath, 'thumb' => '/storage/'.$thumbPath];
    }

    /**
     * Видеофайл сохраняется как есть: перекодировать на этом сервере нечем.
     */
    public static function video(UploadedFile $file): array
    {
        $path = $file->store('uploads/video/'.date('Y/m'), 'public');

        return ['url' => '/storage/'.$path, 'thumb' => null];
    }

    /* ---------- внутреннее ---------- */

    private static function read(string $path, string $ext)
    {
        return match ($ext) {
            'png' => @imagecreatefrompng($path),
            'webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => @imagecreatefromjpeg($path),
        } ?: null;
    }

    /**
     * Телефоны пишут ориентацию в EXIF, а не поворачивают пиксели.
     * Без этого часть фотографий окажется боком.
     */
    private static function fixOrientation($img, string $path, string $ext)
    {
        if (! in_array($ext, ['jpg', 'jpeg'], true) || ! function_exists('exif_read_data')) {
            return $img;
        }

        $exif = @exif_read_data($path);
        $o = $exif['Orientation'] ?? 1;

        $angle = match ($o) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if ($angle === 0) {
            return $img;
        }

        $rotated = imagerotate($img, $angle, 0);
        if ($rotated) {
            imagedestroy($img);

            return $rotated;
        }

        return $img;
    }

    private static function resize($src, int $maxSide)
    {
        $w = imagesx($src);
        $h = imagesy($src);
        $scale = min(1, $maxSide / max($w, $h));   // не увеличиваем маленькие снимки
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $dst = imagecreatetruecolor($nw, $nh);
        imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));  // фон под прозрачность PNG
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

        return $dst;
    }

    private static function encode($img): string
    {
        ob_start();
        imagejpeg($img, null, self::QUALITY);

        return (string) ob_get_clean();
    }
}
