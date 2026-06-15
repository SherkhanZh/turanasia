<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tours', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();

            // Переводимые поля (RU/KZ/EN) — JSON
            $table->json('title');
            $table->json('short_description')->nullable();
            $table->json('description')->nullable();
            $table->json('program')->nullable();        // программа тура по дням
            $table->json('included')->nullable();       // включённые услуги
            $table->json('extras')->nullable();         // дополнительные услуги

            // Структурированные (фильтруемые) поля
            $table->foreignId('direction_id')->nullable()->constrained('directions')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->unsignedInteger('price')->default(0);
            $table->string('currency', 3)->default('KZT');
            $table->unsignedSmallInteger('duration_days')->default(1);

            $table->json('photos')->nullable();          // массив путей
            $table->enum('status', ['published', 'hidden', 'archived'])->default('hidden');
            $table->boolean('is_fixed_price')->default(false); // оплата на сайте (этап 2)
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('sort')->default(0);

            // Источник данных тура (на будущее для внешних поставщиков). external_source = manual|...
            $table->string('external_source')->default('manual');
            $table->string('external_id')->nullable();

            $table->timestamps();

            $table->index(['status', 'price', 'duration_days']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tours');
    }
};
