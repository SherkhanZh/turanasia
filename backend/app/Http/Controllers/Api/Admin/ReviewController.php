<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Support\AdminSerializer;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index()
    {
        return response()->json(
            AdminSerializer::collection(Review::with('tour')->orderBy('sort')->latest()->get())
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $review = new Review;
        $review->setTranslations('text', $data['text'] ?? []);
        unset($data['text']);
        $review->fill($data)->save();

        return response()->json(AdminSerializer::make($review), 201);
    }

    public function update(Request $request, Review $review)
    {
        $data = $this->validateData($request);
        if (isset($data['text'])) {
            $review->setTranslations('text', $data['text']);
            unset($data['text']);
        }
        $review->fill($data)->save();

        return response()->json(AdminSerializer::make($review));
    }

    public function togglePublish(Review $review)
    {
        $review->update(['is_published' => ! $review->is_published]);

        return response()->json(['is_published' => $review->is_published]);
    }

    public function destroy(Review $review)
    {
        $review->delete();

        return response()->json(['message' => 'Отзыв удалён.']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'author_name' => ['required', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:80'],
            'avatar' => ['nullable', 'string', 'max:255'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'type' => ['nullable', 'in:text,photo,video'],
            'text' => ['required', 'array'],
            'text.ru' => ['required', 'string'],
            'media' => ['nullable', 'array'],
            'video_url' => ['nullable', 'string', 'max:255'],
            'tour_id' => ['nullable', 'exists:tours,id'],
            'is_published' => ['boolean'],
            'sort' => ['nullable', 'integer'],
        ]);
    }
}
