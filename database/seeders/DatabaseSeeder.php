<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** Roles and permissions are needed everywhere. Demo people come later (DemoSeeder). */
    public function run(): void
    {
        $this->call([PermissionSeeder::class, DutyTypeSeeder::class, CampusLocationSeeder::class]);
    }
}
