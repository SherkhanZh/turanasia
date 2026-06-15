<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:160'],
            'tour_id' => ['nullable', 'integer', 'exists:tours,id'],
            'tour_title' => ['nullable', 'string', 'max:200'],
            'people' => ['nullable', 'integer', 'min:1', 'max:99'],
            'preferred_date' => ['nullable', 'date'],
            'message' => ['nullable', 'string', 'max:2000'],
            'source' => ['nullable', 'in:site,whatsapp,phone'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Укажите имя.',
            'phone.required' => 'Укажите телефон для связи.',
        ];
    }
}
