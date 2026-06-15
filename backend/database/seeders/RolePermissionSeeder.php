<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'tours.manage', 'directions.manage', 'leads.manage',
            'reviews.manage', 'banners.manage', 'contacts.manage',
            'seo.manage', 'staff.manage', 'settings.manage',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(Permission::all());

        // Контент-менеджер: всё, кроме управления сотрудниками и системными настройками.
        $manager = Role::firstOrCreate(['name' => 'content-manager', 'guard_name' => 'web']);
        $manager->syncPermissions([
            'tours.manage', 'directions.manage', 'leads.manage',
            'reviews.manage', 'banners.manage', 'contacts.manage', 'seo.manage',
        ]);
    }
}
