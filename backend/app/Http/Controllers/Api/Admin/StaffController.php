<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StaffController extends Controller
{
    public function index()
    {
        return response()->json(
            User::with('roles')->get()->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'is_active' => $u->is_active,
                'roles' => $u->getRoleNames(),
            ])
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', 'in:admin,content-manager'],
        ]);

        $password = Str::random(12);
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($password),
        ]);
        $user->assignRole($data['role']);

        // В реальном проекте — отправить приглашение на e-mail со ссылкой на смену пароля.
        return response()->json([
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            'temporary_password' => $password,
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
            'role' => ['sometimes', 'in:admin,content-manager'],
        ]);

        $user->update(array_filter($data, fn ($k) => $k !== 'role', ARRAY_FILTER_USE_KEY));
        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        return response()->json(['message' => 'Сотрудник обновлён.']);
    }
}
