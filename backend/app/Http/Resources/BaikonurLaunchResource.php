<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BaikonurLaunchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'group_id' => $this->group_id,
            'title' => $this->title,
            'rocket' => $this->rocket,
            'description' => $this->description,
            'program' => $this->program,
            'conditions' => $this->conditions,
            'launch_date' => $this->launch_date?->toDateString(),
            'launch_time' => $this->launch_time,
            'seats' => $this->seats,
            'price' => $this->price,
            'currency' => $this->currency,
            'photos' => $this->photos ?? [],
            'videos' => $this->videos ?? [],
            'date_mode' => $this->date_mode,
            'price_individual' => $this->price_individual,
            'excursions' => $this->whenLoaded('excursions', fn () => $this->excursions->map(fn ($e) => [
                'id' => $e->id,
                'slug' => $e->slug,
                'title' => $e->title,
                'short_description' => $e->short_description,
                'description' => $e->description,
                'program' => $e->program,
                'included' => $e->included,
                'duration_hours' => $e->duration_hours,
                'photos' => $e->photos ?? [],
            ])),
            'status' => $this->status,
            // На этапе 1 — кнопка-заглушка (онлайн-оплата позже)
            'booking_enabled' => $this->booking_enabled,
        ];
    }
}
