<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadRequest;
use App\Models\Lead;
use App\Models\Tour;
use App\Notifications\LeadConfirmationNotification;
use App\Notifications\NewLeadNotification;
use Illuminate\Support\Facades\Notification;

class LeadController extends Controller
{
    /**
     * Приём заявки с сайта.
     * После сохранения: менеджер получает уведомление, клиент — подтверждение.
     */
    public function store(StoreLeadRequest $request)
    {
        $data = $request->validated();

        // Снимок названия тура на момент заявки
        if (! empty($data['tour_id']) && empty($data['tour_title'])) {
            $data['tour_title'] = optional(Tour::find($data['tour_id']))->title;
        }

        $data['locale'] = app()->getLocale();
        $data['status'] = 'new';
        $data['source'] = $data['source'] ?? 'site';

        $lead = Lead::create($data);

        // Уведомление менеджеру
        $managerEmail = env('MANAGER_EMAIL', 'info@turan-asia.kz');
        Notification::route('mail', $managerEmail)->notify(new NewLeadNotification($lead));

        // Подтверждение клиенту (если оставил e-mail)
        if ($lead->email) {
            Notification::route('mail', $lead->email)->notify(new LeadConfirmationNotification($lead));
        }

        return response()->json([
            'message' => 'Заявка отправлена. Мы свяжемся с вами в ближайшее время.',
            'id' => $lead->id,
        ], 201);
    }
}
