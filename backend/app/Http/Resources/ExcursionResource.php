<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Экскурсия на своей странице.
 *
 * Цену не отдаём: экскурсия отдельно не продаётся, она входит в стоимость
 * тура. Значение в админке остаётся справочным, для менеджера.
 */
class ExcursionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'program' => $this->program,
            'included' => $this->included,
            'extras' => $this->extras,
            'duration_hours' => $this->duration_hours,
            'photos' => $this->photos ?? [],
            'videos' => $this->videos ?? [],
            'direction' => $this->whenLoaded('direction', fn () => $this->direction ? [
                'slug' => $this->direction->slug,
                'name' => $this->direction->name,
            ] : null),
        ];
    }
}
