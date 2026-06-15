<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TourResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'section' => $this->section,
            'trip_type' => $this->trip_type,
            'title' => $this->title,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'program' => $this->program,
            'included' => $this->included,
            'extras' => $this->extras,
            'price' => $this->price,
            'currency' => $this->currency,
            'duration_days' => $this->duration_days,
            'seats' => $this->seats,
            'photos' => $this->photos ?? [],
            'is_fixed_price' => $this->is_fixed_price,
            'booking_enabled' => $this->booking_enabled,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'slug' => $this->category->slug,
                'name' => $this->category->name,
            ] : null),
            'direction' => $this->whenLoaded('direction', fn () => $this->direction ? [
                'id' => $this->direction->id,
                'slug' => $this->direction->slug,
                'name' => $this->direction->name,
                'scope' => $this->direction->scope,
            ] : null),
            'dates' => $this->whenLoaded('dates', fn () => $this->dates->map(fn ($d) => [
                'start_date' => $d->start_date?->toDateString(),
                'end_date' => $d->end_date?->toDateString(),
                'seats' => $d->seats,
                'price' => $d->price_override ?? $this->price,
            ])),
        ];
    }
}
