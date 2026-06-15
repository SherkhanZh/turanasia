<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $q = Lead::query()->with('tour');

        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }
        if ($request->filled('q')) {
            $q->where(fn ($w) => $w->where('name', 'ilike', '%'.$request->q.'%')
                ->orWhere('phone', 'ilike', '%'.$request->q.'%'));
        }

        return response()->json($q->latest()->paginate((int) $request->integer('per_page', 25)));
    }

    public function show(Lead $lead)
    {
        return response()->json($lead->load('tour'));
    }

    public function updateStatus(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'status' => ['required', 'in:'.implode(',', Lead::STATUSES)],
        ]);
        $lead->update($data);

        return response()->json(['status' => $lead->status]);
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();

        return response()->json(['message' => 'Заявка удалена.']);
    }
}
