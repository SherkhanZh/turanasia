<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Медиатека: альбомы и их содержимое.
 *
 * Альбом либо показывается в публичной галерее, либо доступен только по прямой
 * ссылке — для подборок, которые менеджер отправляет конкретному клиенту.
 * У скрытых альбомов адрес случайный, чтобы его нельзя было подобрать.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('albums', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('title');
            $table->json('description')->nullable();
            $table->string('cover')->nullable();            // обложка списка
            $table->enum('visibility', ['public', 'unlisted'])->default('unlisted');
            $table->foreignId('tour_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['visibility', 'sort']);
        });

        Schema::create('album_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('album_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['image', 'video'])->default('image');
            $table->string('url');                          // путь к файлу или ссылка на ролик
            $table->string('thumb')->nullable();            // миниатюра (для фото — уменьшенная копия)
            $table->json('caption')->nullable();            // подпись
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['album_id', 'sort']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('album_items');
        Schema::dropIfExists('albums');
    }
};
