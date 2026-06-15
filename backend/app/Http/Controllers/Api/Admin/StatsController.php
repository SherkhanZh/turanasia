<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Review;
use App\Models\Tour;

class StatsController extends Controller
{
    public function index()
    {
        return response()->json([
            'leads_new' => Lead::where('status', 'new')->count(),
            'leads_total' => Lead::count(),
            'tours_active' => Tour::where('status', 'published')->count(),
            'tours_total' => Tour::count(),
            'reviews_published' => Review::where('is_published', true)->count(),
            'leads_by_status' => [
                'new' => Lead::where('status', 'new')->count(),
                'in_progress' => Lead::where('status', 'in_progress')->count(),
                'processed' => Lead::where('status', 'processed')->count(),
                'done' => Lead::where('status', 'done')->count(),
            ],
            'recent_leads' => Lead::with('tour')->latest()->limit(8)->get()->map(fn ($l) => [
                'id' => $l->id,
                'name' => $l->name,
                'phone' => $l->phone,
                'tour_title' => $l->tour_title,
                'status' => $l->status,
                'created_at' => $l->created_at?->toDateTimeString(),
            ]),
        ]);
    }
}
