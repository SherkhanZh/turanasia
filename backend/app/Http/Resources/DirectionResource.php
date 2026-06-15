<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DirectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'type' => $this->type,
            'scope' => $this->scope,
            'name' => $this->name,
            'description' => $this->description,
            'info' => $this->info,
            'photos' => $this->photos ?? [],
            'children' => DirectionResource::collection($this->whenLoaded('children')),
            'tours_count' => $this->when(isset($this->tours_count), $this->tours_count),
        ];
    }
}
