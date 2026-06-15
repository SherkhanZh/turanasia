<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Запуски/туры на Байконур — данные вводятся вручную в админке.
        Schema::create('baikonur_launches', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('title');               // название миссии/тура
            $table->json('rocket')->nullable();  // ракета-носитель
            $table->json('description')->nullable();
            $table->json('program')->nullable(); // программа тура
            $table->json('conditions')->nullable(); // условия бронирования
            $table->date('launch_date')->nullable();
            $table->time('launch_time')->nullable();
            $table->unsignedSmallInteger('seats')->nullable();
            $table->unsignedInteger('price')->nullable();
            $table->string('currency', 3)->default('KZT');
            $table->json('photos')->nullable();
            $table->enum('status', ['scheduled', 'published', 'hidden', 'completed'])->default('published');
            $table->boolean('booking_enabled')->default(false); // заглушка кнопки брони на этапе 1
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['status', 'launch_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('baikonur_launches');
    }
};
