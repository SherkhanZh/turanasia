<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Support\AdminSerializer;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index(Request $request)
    {
        $q = Faq::query()->orderBy('sort');
        if ($request->filled('group')) {
            $q->where('group', $request->group);
        }

        return response()->json(AdminSerializer::collection($q->get()));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $faq = new Faq;
        $this->fill($faq, $data)->save();

        return response()->json(AdminSerializer::make($faq), 201);
    }

    public function update(Request $request, Faq $faq)
    {
        $data = $this->validateData($request);
        $this->fill($faq, $data)->save();

        return response()->json(AdminSerializer::make($faq));
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();

        return response()->json(['message' => 'Вопрос удалён.']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'group' => ['required', 'string', 'max:50'],
            'question' => ['required', 'array'],
            'question.ru' => ['required', 'string'],
            'answer' => ['required', 'array'],
            'answer.ru' => ['required', 'string'],
            'is_active' => ['boolean'],
            'sort' => ['nullable', 'integer'],
        ]);
    }

    private function fill(Faq $f, array $data): Faq
    {
        foreach (['question', 'answer'] as $field) {
            if (array_key_exists($field, $data)) {
                $f->setTranslations($field, $data[$field]);
                unset($data[$field]);
            }
        }
        $f->fill($data);

        return $f;
    }
}
