<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->foreignId('tour_id')->nullable()->constrained('tours')->nullOnDelete();
            $table->string('tour_title')->nullable(); // снимок названия тура на момент заявки
            $table->unsignedSmallInteger('people')->nullable();
            $table->date('preferred_date')->nullable();
            $table->text('message')->nullable();
            $table->enum('status', ['new', 'in_progress', 'processed', 'done'])->default('new');
            $table->string('locale', 5)->default('ru');
            $table->string('source')->default('site'); // site|whatsapp|phone
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
