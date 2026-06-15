<?php

namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeadConfirmationNotification extends Notification
{
    use Queueable;

    public function __construct(public Lead $lead) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Turan Asia — мы получили вашу заявку')
            ->greeting('Здравствуйте, '.$this->lead->name.'!')
            ->line('Спасибо за заявку. Наш менеджер свяжется с вами в ближайшее время.')
            ->lineIf((bool) $this->lead->tour_title, 'Тур: '.$this->lead->tour_title)
            ->line('С уважением, команда Turan Asia');
    }
}
