<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@turan-asia.kz'],
            ['name' => 'Серик Ж.', 'password' => Hash::make('password'), 'is_active' => true]
        );
        $admin->syncRoles(['admin']);

        $manager = User::updateOrCreate(
            ['email' => 'aigerim@turan-asia.kz'],
            ['name' => 'Айгерим К.', 'password' => Hash::make('password'), 'is_active' => true]
        );
        $manager->syncRoles(['content-manager']);
    }
}
