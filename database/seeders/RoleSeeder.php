<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Access\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (RoleCode::cases() as $case) {
            Role::query()->updateOrCreate(['code' => $case->value], ['name' => $case->label()]);
        }
    }
}
