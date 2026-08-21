<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Экскурсии в запусках Байконура.
 *
 * Запуски лежат в своей таблице, а не в турах, поэтому связь с общим
 * справочником экскурсий нужна отдельная. Экскурсия остаётся одна на весь
 * сайт: «Музей космодрома» может входить и в тур, и в запуск.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('baikonur_launch_excursion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('baikonur_launch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('excursion_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort')->default(0);
            $table->unique(['baikonur_launch_id', 'excursion_id'], 'baikonur_launch_excursion_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('baikonur_launch_excursion');
    }
};
