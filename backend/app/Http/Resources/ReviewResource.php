<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'author_name' => $this->author_name,
            'country' => $this->country,
            'avatar' => $this->avatar,
            'rating' => $this->rating,
            'text' => $this->text,
            'tour' => $this->whenLoaded('tour', fn () => $this->tour?->title),
        ];
    }
}
