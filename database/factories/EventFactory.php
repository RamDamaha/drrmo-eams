<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Events\Models\CampusLocation;
use App\Modules\Events\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Event> */
class EventFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $start = now()->addDays(7)->setTime(7, 0);

        return [
            'title' => fake()->words(3, true),
            'campus_location_id' => fn () => CampusLocation::query()->firstOrCreate(
                ['name' => 'Test location'],
                ['latitude' => 6.91212, 'longitude' => 122.05909],
            )->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addHours(8),
        ];
    }
}
