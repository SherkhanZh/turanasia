<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Категории туров получают раздел, картинку и описание.
 * Раздел нужен, чтобы на странице «Туры по Казахстану» не показывались
 * категории зарубежных поездок и наоборот.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('section', 32)->default('kazakhstan')->after('slug');
            $table->json('description')->nullable()->after('name');
            $table->string('image')->nullable()->after('description');
            $table->boolean('is_active')->default(true)->after('image');
        });

        // Слаг был уникальным глобально; теперь одна и та же «Классика»
        // может существовать и в Казахстане, и за рубежом.
        DB::statement('ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_unique');

        Schema::table('categories', function (Blueprint $table) {
            $table->unique(['section', 'slug'], 'categories_section_slug_unique');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique('categories_section_slug_unique');
            $table->dropColumn(['section', 'description', 'image', 'is_active']);
        });

        // Возвращаем глобальную уникальность слага, снятую в up().
        Schema::table('categories', function (Blueprint $table) {
            $table->unique('slug', 'categories_slug_unique');
        });
    }
};
