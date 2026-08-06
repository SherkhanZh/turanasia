<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Структура тура: цена для индивидуальных, видео-галерея
 * и признак «с датами / без дат (под запрос)».
 * Применяется и к турам, и к запускам Байконура.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            // fixed — есть конкретные даты выездов; on_request — без дат, под запрос
            $table->string('date_mode', 20)->default('fixed');
            $table->unsignedInteger('price_individual')->nullable();
            $table->json('videos')->nullable();
        });

        Schema::table('baikonur_launches', function (Blueprint $table) {
            $table->string('date_mode', 20)->default('fixed');
            $table->unsignedInteger('price_individual')->nullable();
            $table->json('videos')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            $table->dropColumn(['date_mode', 'price_individual', 'videos']);
        });

        Schema::table('baikonur_launches', function (Blueprint $table) {
            $table->dropColumn(['date_mode', 'price_individual', 'videos']);
        });
    }
};
