<?php

namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewLeadNotification extends Notification
{
    use Queueable;

    public function __construct(public Lead $lead) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $l = $this->lead;

        return (new MailMessage)
            ->subject('Новая заявка с сайта — '.$l->name)
            ->greeting('Новая заявка')
            ->line('Имя: '.$l->name)
            ->line('Телефон: '.$l->phone)
            ->lineIf((bool) $l->email, 'E-mail: '.$l->email)
            ->lineIf((bool) $l->tour_title, 'Тур: '.$l->tour_title)
            ->lineIf((bool) $l->people, 'Кол-во человек: '.$l->people)
            ->lineIf((bool) $l->preferred_date, 'Желаемая дата: '.optional($l->preferred_date)->format('d.m.Y'))
            ->lineIf((bool) $l->message, 'Комментарий: '.$l->message)
            ->action('Открыть в админке', url('/admin#leads'))
            ->line('Источник: '.$l->source);
    }
}
