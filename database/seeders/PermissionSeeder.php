<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Access\Models\Permission;
use App\Modules\Access\Models\Role;
use App\Modules\Access\Support\PermissionMatrix;
use Illuminate\Database\Seeder;

/** Safe to run again: it adds, updates and removes rows to match PermissionMatrix. */
class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $matrix = PermissionMatrix::permissions();

        foreach ($matrix as $code => $def) {
            Permission::query()->updateOrCreate(
                ['code' => $code],
                ['description' => $def['description'], 'grantable' => $def['grantable']],
            );
        }

        Permission::query()->whereNotIn('code', array_keys($matrix))->delete();

        foreach (RoleCode::cases() as $case) {
            $ids = Permission::query()->whereIn('code', PermissionMatrix::codesFor($case))->pluck('id');
            Role::query()->where('code', $case->value)->firstOrFail()->permissions()->sync($ids);
        }
    }
}
