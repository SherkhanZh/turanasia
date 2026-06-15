<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            // Раздел каталога: туры по Казахстану / зарубежные групповые / Байконур
            $table->enum('section', ['kazakhstan', 'foreign', 'baikonur'])->default('kazakhstan')->after('slug');
            // Для туров по Казахстану: однодневные / многодневные
            $table->enum('trip_type', ['one_day', 'multi_day'])->nullable()->after('section');
            $table->unsignedSmallInteger('seats')->nullable()->after('duration_days');
            // Кнопка бронирования (на этапе 1 — заглушка, онлайн-оплата позже)
            $table->boolean('booking_enabled')->default(false)->after('is_fixed_price');
            $table->index('section');
        });
    }

    public function down(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            $table->dropColumn(['section', 'trip_type', 'seats', 'booking_enabled']);
        });
    }
};
