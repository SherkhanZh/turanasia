<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            // Текстовый / фото / видео отзыв
            $table->enum('type', ['text', 'photo', 'video'])->default('text')->after('rating');
            $table->json('media')->nullable()->after('text');   // фото отзыва
            $table->string('video_url')->nullable()->after('media');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['type', 'media', 'video_url']);
        });
    }
};
