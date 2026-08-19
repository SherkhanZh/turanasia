<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Категории туров на Байконур.
 *
 * Над отдельными запусками появляется уровень группировки: несколько туров
 * относятся к одной программе. На странице это кнопки-фильтры под сортировкой.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('baikonur_groups', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('title');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort']);
        });

        Schema::table('baikonur_launches', function (Blueprint $table) {
            $table->foreignId('group_id')->nullable()->after('slug')
                ->constrained('baikonur_groups')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('baikonur_launches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('group_id');
        });
        Schema::dropIfExists('baikonur_groups');
    }
};
