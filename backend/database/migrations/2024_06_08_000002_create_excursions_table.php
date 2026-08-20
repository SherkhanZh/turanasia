<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Экскурсии — общий справочник. Одна и та же экскурсия
 * повторяется в разных турах, поэтому связь многие-ко-многим.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('excursions', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('title');
            $table->json('short_description')->nullable();
            $table->json('description')->nullable();
            $table->json('program')->nullable();
            $table->json('included')->nullable();
            $table->json('extras')->nullable();
            $table->foreignId('direction_id')->nullable()->constrained('directions')->nullOnDelete();
            $table->unsignedInteger('price')->nullable();
            $table->string('currency', 8)->default('KZT');
            $table->unsignedSmallInteger('duration_hours')->nullable();
            $table->json('photos')->nullable();
            $table->json('videos')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('excursion_tour', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained()->cascadeOnDelete();
            $table->foreignId('excursion_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort')->default(0);
            $table->unique(['tour_id', 'excursion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('excursion_tour');
        Schema::dropIfExists('excursions');
    }
};
