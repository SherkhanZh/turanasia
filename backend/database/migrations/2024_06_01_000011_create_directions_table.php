<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('directions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('directions')->nullOnDelete();
            $table->enum('type', ['country', 'region', 'city']);
            // Разграничение туров: в Казахстан / из Казахстана (задаётся на уровне страны)
            $table->enum('scope', ['domestic', 'outbound'])->nullable();
            $table->string('slug')->unique();
            $table->json('name');
            $table->json('description')->nullable();
            $table->json('info')->nullable();        // доп. информация для туристов
            $table->json('photos')->nullable();      // массив путей к фото
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['type', 'parent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('directions');
    }
};
