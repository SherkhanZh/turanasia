<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tour_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained('tours')->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->unsignedSmallInteger('seats')->nullable();
            $table->unsignedInteger('price_override')->nullable();
            $table->timestamps();

            $table->index(['tour_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_dates');
    }
};
