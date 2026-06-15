<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json(
            Setting::all()->get()->map(fn ($s) => [
                'key' => $s->key, 'value' => $s->value, 'group' => $s->group,
            ])
        );
    }

    /**
     * Массовое сохранение настроек (контакты, соцсети, карта).
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable'],
            'settings.*.group' => ['nullable', 'string'],
        ]);

        foreach ($data['settings'] as $item) {
            Setting::put($item['key'], $item['value'] ?? null, $item['group'] ?? 'general');
        }

        return response()->json(['message' => 'Настройки сохранены.']);
    }
}
