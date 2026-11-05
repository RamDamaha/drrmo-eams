<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Events\Models\CampusLocation;
use Illuminate\Database\Seeder;

/** Coordinates are placeholders around the campus centre. The DRRMO confirms them on the map. */
class CampusLocationSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['ZPPSU main campus', 6.91212, 122.05909],
            ['Main gate', 6.91160, 122.05880],
            ['Gymnasium', 6.91250, 122.05950],
            ['Field', 6.91300, 122.05850],
            ['Administration building', 6.91220, 122.05920],
        ] as [$name, $lat, $lng]) {
            CampusLocation::query()->firstOrCreate(['name' => $name], ['latitude' => $lat, 'longitude' => $lng]);
        }
    }
}
