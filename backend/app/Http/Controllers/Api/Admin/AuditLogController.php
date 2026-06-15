<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Журнал действий сотрудников (только администратор).
     */
    public function index(Request $request)
    {
        $q = AuditLog::query()->with('user')->latest();

        if ($request->filled('subject_type')) {
            $q->where('subject_type', $request->subject_type);
        }
        if ($request->filled('user_id')) {
            $q->where('user_id', $request->user_id);
        }

        return response()->json($q->paginate((int) $request->integer('per_page', 50)));
    }
}
