<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->string('author_name');
            $table->string('country')->nullable();
            $table->string('avatar')->nullable();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->json('text');          // переводимый текст отзыва
            $table->foreignId('tour_id')->nullable()->constrained('tours')->nullOnDelete();
            $table->boolean('is_published')->default(false);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
