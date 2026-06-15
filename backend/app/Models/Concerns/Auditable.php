<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

/**
 * Журналирование действий админки: создание / изменение / удаление.
 * Подключается к моделям контента (use Auditable).
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(fn ($model) => $model->writeAudit('created', $model->getAttributes()));
        static::updated(fn ($model) => $model->writeAudit('updated', $model->getChanges()));
        static::deleted(fn ($model) => $model->writeAudit('deleted', []));
    }

    public function writeAudit(string $event, array $changes): void
    {
        // Логируем только действия аутентифицированного сотрудника (админка).
        if (! Auth::check()) {
            return;
        }

        AuditLog::create([
            'user_id' => Auth::id(),
            'user_name' => Auth::user()->name ?? null,
            'event' => $event,
            'subject_type' => class_basename($this),
            'subject_id' => $this->getKey(),
            'changes' => collect($changes)->except(['updated_at', 'created_at', 'password'])->all(),
            'ip' => request()->ip(),
        ]);
    }
}
