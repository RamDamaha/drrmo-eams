<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Events\Models\DutyType;
use Illuminate\Database\Seeder;

class DutyTypeSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'Emergency responder',
            'Auxiliary to campus security',
            'CCTV monitoring and surveillance',
            'Enforcement of campus policies',
            'Crowd control',
            'Office work',
            'Fire suppression',
        ] as $name) {
            DutyType::query()->firstOrCreate(['name' => $name]);
        }
    }
}
