<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TourCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'short_description' => $this->short_description,
            'price' => $this->price,
            'currency' => $this->currency,
            'duration_days' => $this->duration_days,
            'photo' => is_array($this->photos) ? ($this->photos[0] ?? null) : null,
            'is_featured' => $this->is_featured,
            'is_fixed_price' => $this->is_fixed_price,
            'category' => $this->whenLoaded('category', fn () => $this->category?->name),
            'direction' => $this->whenLoaded('direction', fn () => $this->direction?->name),
        ];
    }
}
