<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Свой адрес у каждого фото и видео.
 *
 * Менеджеру нужно отправлять клиенту не только альбом целиком, но и отдельный
 * снимок. Код случайный, поэтому по чужой ссылке ничего не подберёшь.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('album_items', function (Blueprint $table) {
            $table->string('code', 24)->nullable()->unique()->after('album_id');
        });

        // Проставляем код уже существующим материалам
        DB::table('album_items')->whereNull('code')->orderBy('id')->each(function ($row) {
            DB::table('album_items')->where('id', $row->id)->update([
                'code' => Str::lower(Str::random(16)),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('album_items', function (Blueprint $table) {
            $table->dropColumn('code');
        });
    }
};
