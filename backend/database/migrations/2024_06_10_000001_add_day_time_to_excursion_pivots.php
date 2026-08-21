<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * День и время экскурсии.
 *
 * Хранится в связке, а не в самой экскурсии: «Музей космодрома» в одном туре
 * приходится на второй день, в другом — на четвёртый. Оба поля необязательные,
 * менеджер может отметить экскурсию и не расписывать расписание.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['excursion_tour', 'baikonur_launch_excursion'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->unsignedSmallInteger('day')->nullable();
                $t->string('time', 5)->nullable();   // «09:00»
            });
        }
    }

    public function down(): void
    {
        foreach (['excursion_tour', 'baikonur_launch_excursion'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn(['day', 'time']);
            });
        }
    }
};
