<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Реальные контакты вместо демонстрационных.
 *
 * Настройки заполнял демо-сидер вымышленными значениями, а сайт их не читал —
 * контакты были прописаны прямо в вёрстке. Теперь сайт берёт их из настроек,
 * поэтому в базе должны лежать настоящие данные.
 *
 * Перезаписываем только демо-значения: если контакты уже поправили руками,
 * миграция их не тронет.
 */
return new class extends Migration
{
    private array $demo = [
        'phone' => '+7 702 123 45 67',
        'email' => 'info@turan-asia.kz',
        'address' => 'г. Алматы, пр. Абая 117/6',
        'work_hours' => 'Пн–Пт: 9:00–18:00',
    ];

    private array $real = [
        'phone' => '+7 776 273 05 05',
        'phone2' => '+7 776 273 03 03',
        'email' => 'info@turanasia.kz',
        'address' => 'Алматы, ул. Желтоксан, 111а',
        'work_hours' => '09:00 – 19:00',
    ];

    public function up(): void
    {
        foreach ($this->real as $key => $value) {
            $row = DB::table('settings')->where('key', $key)->first();

            // Значения нет вовсе либо оно демонстрационное — ставим настоящее
            $current = $row ? trim((string) json_decode($row->value ?? 'null', true)) : null;
            $isDemo = $row === null || $current === '' || $current === ($this->demo[$key] ?? null);

            if ($isDemo) {
                Setting::put($key, $value, 'contacts');
            }
        }
    }

    public function down(): void
    {
        // Возврат к вымышленным контактам смысла не имеет
    }
};
